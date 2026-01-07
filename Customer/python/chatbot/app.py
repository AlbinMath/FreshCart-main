from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from groq import Groq

# Load environment variables from parent .env
load_dotenv(dotenv_path='../.env')

app = Flask(__name__)
CORS(app) # Enable CORS for frontend

print("--- STARTING NEW VERSION WITH llama-3.3-70b-versatile ---")
# Initialize Groq Client
api_key = os.getenv('GROQ_API_KEY')
if not api_key:
    print("ERROR: GROQ_API_KEY not found in environment variables!")
else:
    print(f"GROQ_API_KEY found: {api_key[:4]}...")

groq_client = Groq(api_key=api_key)

# Hardcoded safe model (Adaptive selection was causing issues with hidden decommissioned models)
CURRENT_MODEL = "llama-3.3-70b-versatile" 
print(f"Forcing Model: {CURRENT_MODEL}")

# ... (rest of code)


SYSTEM_CONTEXT = """You are 'FreshCart', a helpful AI assistant for the FreshCart e-commerce platform.
SCOPE: You ONLY help customers with:
1. Fresh Groceries (Vegetables, Fruits, Dairy, Meat, Seafood).
2. Tracking their existing orders.

RULES:
- If use asks about ELECTRONICS (like 'JBL', 'phones', 'laptops'), CLOTHES, or other non-grocery items, you must politely REFUSE.
- Say: "I'm sorry, but FreshCart only delivers fresh grocery products (Vegetables, Non-Veg, Fruits). We do not sell electronics or other items."
- Do NOT try to be helpful for out-of-scope requests.
- Answer based on the provided Database Context if available.
"""
# Context file loading removed as per user request



# Database Connections
dbs = {}

def get_db_connection(env_var, db_name):
    try:
        uri = os.getenv(env_var)
        if not uri:
            print(f"Warning: {env_var} not found in .env")
            return None
        client = MongoClient(uri)
        print(f"Connected to {db_name} DB")
        return client[db_name] # Return the Database object
    except Exception as e:
        print(f"Error connecting to {db_name}: {e}")
        return None

try:
    # Initialize all DB connections
    dbs['ChatBot'] = get_db_connection('MONGODB_URI_ChatBot', 'ChatBot')
    dbs['Users'] = get_db_connection('MONGODB_URI_Users', 'Users') # Collections: Admin, Administrator, Customer, Deliveryagent
    dbs['Seller'] = get_db_connection('MONGODB_URI_Seller', 'Seller') # Collections: Seller, address
    dbs['Customer'] = get_db_connection('MONGODB_URI_Customer', 'Customer') # Collections: Cart, address
    dbs['Products'] = get_db_connection('MONGODB_URI_Products', 'Products') # Collections: Orders, products
    dbs['Registrations'] = get_db_connection('MONGODB_URI_Registrations', 'Registrations') # Collections: deliveryagents, sellers
    dbs['Announcements'] = get_db_connection('MONGODB_URI_Announcements', 'Announcements') # Collections: Admin/Administrator Communication, Announcements
    
    # Verify primary connection
    if dbs['ChatBot'] is not None:
        print("ChatBot DB ready")
        
except Exception as e:
    print(f"Global DB Connection Error: {e}")

@app.route('/', methods=['GET'])
def home():
    return "Chatbot Service is Running"

@app.route('/chat', methods=['GET', 'POST'])
def chat():
    if request.method == 'GET':
        return jsonify({"message": "Chatbot API is running. Send a POST request to chat."})

    data = request.json
    user_message = data.get('message', '')
    user_id = data.get('userId') # Get userId from request
    user_message_lower = user_message.lower()
    
    response_text = ""
    dynamic_context = ""

    # Helper: Fetch Orders
    def get_recent_orders_context(uid, limit=3):
        if not uid or dbs['Products'] is None:
            return ""
        try:
            orders_col = dbs['Products']['Orders'] # Note: Collection name might be case-sensitive, assuming 'Orders' based on user prompt
            # If collection name is different (e.g. 'orders'), this needs adjustment. 
            # Trying both if first fails? No, let's stick to 'Orders' as per prompt.
            
            # Find recent orders
            orders_cursor = orders_col.find({"userId": uid}).sort("createdAt", -1).limit(limit)
            orders = list(orders_cursor)
            
            if not orders:
                return "User has no recent orders."
            
            context = f"Recent {len(orders)} Orders:\n"
            for order in orders:
                status = order.get('status', 'Unknown')
                date = order.get('createdAt', 'Unknown Date')
                items = order.get('items', [])
                item_names = ", ".join([i.get('productName', 'Item') for i in items])
                context += f"- Order ID {str(order.get('_id'))}: {status}, Items: {item_names} (Placed: {date})\n"
            return context
        except Exception as e:
            print(f"Order Fetch Error: {e}")
            return ""

    # ... (Product Fetch Helper remains same)

    # Helper: Fetch Products (Enhanced)
    def get_product_context(query_terms):
        if dbs['Products'] is None:
            return ""
        try:
            products_col = dbs['Products']['products']
            # Simple regex search for name
            # Construct regex: match any of the significant terms
            stop_words = {'what', 'is', 'the', 'price', 'of', 'cost', 'how', 'much', 'in', 'available', 'stock'}
            keywords = [w for w in query_terms if w not in stop_words]
            
            if not keywords:
                return ""
                
            regex_pattern = "|".join(keywords)
            # Find up to 3 matching products
            products = list(products_col.find({"productName": {"$regex": regex_pattern, "$options": "i"}}).limit(3))
            
            if not products:
                return ""
            
            context = "Products Found:\n"
            for p in products:
                name = p.get('productName', 'Unknown')
                price = p.get('sellingPrice', 'N/A')
                stock = p.get('stockQuantity', 0)
                desc = p.get('description', '')[:100] # Truncate description
                context += f"- {name}: Price ₹{price}, Stock: {stock}, Desc: {desc}\n"
            return context
        except Exception as e:
            print(f"Product Fetch Error: {e}")
            return ""

    # intent detection keywords
    order_keywords = ['order', 'status', 'track', 'delivery', 'arrived', 'where']
    product_keywords = ['price', 'cost', 'cost', 'how much', 'have', 'stock', 'available', 'buy', 'product', 'find', 'looking', 'is there']
    
    is_list_all = any(k in user_message_lower for k in ['all orders', 'list orders', 'show orders', 'my orders', 'all my orders'])
    is_order_query = any(k in user_message_lower for k in order_keywords) or is_list_all
    
    if is_order_query and user_id:
        limit = 20 if is_list_all else 3
        print(f"Detected Order Query for {user_id} (Limit: {limit})")
        dynamic_context += get_recent_orders_context(user_id, limit=limit)
    
    # Always try product search if not strictly an order status check, or if it might be "price of order"
    # To be safe, let's look for product data if we have product keywords OR if we didn't find orders
    if any(k in user_message_lower for k in product_keywords) or (not is_order_query):
         product_ctx = get_product_context(user_message_lower.split())
         if product_ctx:
             dynamic_context += "\n" + product_ctx

    # Construct System Prompt
    full_system_prompt = SYSTEM_CONTEXT
    if dynamic_context:
        print(f"DEBUG CONTEXT: {dynamic_context}") # Debugging line
        full_system_prompt += f"\n\nContext Data from Database:\n{dynamic_context}\nAnswer based on this data if relevant. If the user asks to list orders, please list them all briefly."

    try:
        print(f"DEBUG: Calling with model={CURRENT_MODEL}")
        completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": full_system_prompt},
                {"role": "user", "content": user_message}
            ],
            model=CURRENT_MODEL, # Use the forced model
        )
        response_text = completion.choices[0].message.content
    except Exception as e:
        print(f"Groq API Error: {e}")
        return jsonify({"response": f"System Error: {str(e)}"})

    return jsonify({"response": response_text})

if __name__ == '__main__':
    port = 5011 # Moved to 5011 due to conflict on 5010
    print(f"Starting Chatbot Server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)
