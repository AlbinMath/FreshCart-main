from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from fuzzywuzzy import fuzz
import os
import re

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB Connections
try:
    # Products Database (contains products, orders, and reviews collections)
    products_client = MongoClient(os.getenv('MONGODB_URI_Products'))
    products_db = products_client['Products']
    products_collection = products_db['products']
    orders_collection = products_db['Orders']
    reviews_collection = products_db['Reviews']
    
    # ChatBot Database (contains FAQs)
    chatbot_client = MongoClient(os.getenv('MONGODB_URI_ChatBot'))
    chatbot_db = chatbot_client['ChatBot']
    faqs_collection = chatbot_db['faqs']
    
    # Users Database (for customer info)
    users_client = MongoClient(os.getenv('MONGODB_URI_Users'))
    users_db = users_client['Users']
    customer_collection = users_db['Customer']
    
    # Customer Database (for cart and addresses)
    customer_client = MongoClient(os.getenv('MONGODB_URI_Customer'))
    customer_db = customer_client['Customer']
    cart_collection = customer_db['Cart']
    address_collection = customer_db['address']
    
    # Seller Database (for store and seller info)
    seller_client = MongoClient(os.getenv('MONGODB_URI_Seller'))
    seller_db = seller_client['Seller']
    sellers_collection = seller_db['sellers']
    stores_collection = seller_db['stores']
    
    # Delivery Database (for delivery agents and info)
    delivery_client = MongoClient(os.getenv('MONGODB_URI_Delivery'))
    delivery_db = delivery_client['Delivery']
    delivery_agents_collection = delivery_db['deliveryagents']
    
    print("✅ Connected to all databases successfully!")
    print("📦 Products DB: products, Orders, Reviews")
    print("🤖 ChatBot DB: faqs")
    print("👥 Users DB: Customer")
    print("🛒 Customer DB: Cart, address")
    print("🏪 Seller DB: sellers, stores")
    print("🚚 Delivery DB: deliveryagents")
except Exception as e:
    print(f"❌ Database connection error: {e}")

# Pagination state (per user session)
user_pagination_state = {}

# Intent Classification
def classify_intent(message):
    """Classify user intent based on message content"""
    message_lower = message.lower().strip()
    words = message_lower.split()
    
    # Check if message is just a greeting word (exact match for short greetings)
    greeting_words = ['hi', 'hello', 'hey', 'greetings', 'hii', 'hiii']
    if message_lower in greeting_words or (len(words) <= 2 and any(w in greeting_words for w in words)):
        return 'greeting'
    
    # Conversational/Question patterns - detect non-product queries
    conversational_patterns = [
        'where are you', 'where you', 'who are you', 'who you', 'what are you',
        'how are you', 'how do', 'why', 'when', 'can you', 'could you',
        'thanks', 'thank you', 'thank', 'bye', 'goodbye', 'ok', 'okay',
        'what is freshcart', 'about freshcart', 'what do you do'
    ]
    if any(pattern in message_lower for pattern in conversational_patterns):
        return 'faq'
    
    # Navigation Commands - Go to Cart
    if any(phrase in message_lower for phrase in ['go to cart', 'goto cart', 'open cart', 'view cart', 'show cart', 'check cart']):
        return 'nav_cart'
    
    # Navigation Commands - Go to Orders
    if any(phrase in message_lower for phrase in ['go to order', 'goto order', 'my orders', 'view orders', 'show orders', 'order page', 'order history']):
        return 'nav_orders'
    
    # Navigation Commands - Logout
    if any(phrase in message_lower for phrase in ['logout', 'log out', 'sign out', 'signout', 'do logout']):
        return 'nav_logout'
    
    # Navigation Commands - Login
    if any(phrase in message_lower for phrase in ['login', 'log in', 'sign in', 'signin', 'do login']):
        return 'nav_login'
    
    # Navigation Commands - Home
    if any(phrase in message_lower for phrase in ['go home', 'goto home', 'home page', 'main page', 'go to home']):
        return 'nav_home'
    
    # Add to Cart Command (must be before cart_inquiry) - detect "add X to/in cart" pattern
    add_cart_pattern = re.compile(r'add\s+\w+.*\s*(to|in)\s*cart|add\s+to\s+cart|add\s+in\s+cart|put\s+in\s+cart')
    if add_cart_pattern.search(message_lower):
        return 'add_to_cart'
    
    # Stock Inquiry - check product stock levels
    if any(phrase in message_lower for phrase in ['stock', 'available', 'availability', 'in stock', 'out of stock', 'how many', 'quantity available']):
        return 'stock_inquiry'
    
    # Cart Inquiry (must be after add_to_cart check)
    if any(word in message_lower for word in ['my cart', 'view cart', 'show cart', 'cart items', 'basket', 'shopping cart']):
        return 'cart_inquiry'
    
    # Review Inquiry
    if any(word in message_lower for word in ['review', 'rating', 'feedback']):
        return 'review_inquiry'
    
    # Delivery Info Inquiry (general delivery questions, agents)
    if any(word in message_lower for word in ['delivary', 'delivery info', 'delivery agents', 'delivery agent', 'deliveries', 'how delivery works', 'delivery process', 'delivery time']):
        return 'delivery_inquiry'
    
    # Order Tracking (specific order related)
    if any(word in message_lower for word in ['order', 'track', 'my delivery', 'status', 'where is my', 'history', 'my orders', 'past orders', 'previous orders', 'all orders']):
        return 'order_tracking'
    
    # Product Search (price, show, find, buy, want)
    if any(word in message_lower for word in ['price', 'cost', 'show', 'find', 'buy', 'want', 'looking for', 'search', 'get']):
        return 'product_search'
    
    # Help
    if any(word in message_lower for word in ['help', 'what can you do', 'features']):
        return 'help'
    
    # Product List (all products)
    if any(word in message_lower for word in ['product', 'products', 'all products', 'list products', 'show all', 'all items', 'menu', 'catalog']):
        return 'product_list'
    
    # Pagination (next, more)
    if any(word in message_lower for word in ['next', 'more', 'continue', 'show more']):
        return 'pagination'
    
    # Store/Seller Inquiry
    if any(word in message_lower for word in ['store', 'stores', 'shop', 'shops', 'seller', 'sellers', 'vendor', 'vendors']):
        return 'store_inquiry'
    
    # Non-Food Products (products we don't sell)
    non_food_items = ['gold', 'silver', 'jewelry', 'jewellery', 'diamond', 'electronics', 'electronic', 
                      'mobile', 'phone', 'laptop', 'computer', 'tv', 'television', 'furniture', 
                      'sofa', 'chair', 'table', 'bed', 'vehicle', 'car', 'bike', 'scooter', 'motorcycle',
                      'house', 'property', 'land', 'real estate', 'flat', 'apartment', 'clothes', 
                      'clothing', 'dress', 'shirt', 'shoes', 'cosmetics', 'makeup', 'perfume',
                      'toys', 'games', 'books', 'medicine', 'medicines', 'drugs', 'alcohol', 'liquor',
                      'cigarette', 'tobacco', 'watch', 'watches', 'bags', 'bag']
    if any(item in message_lower for item in non_food_items):
        return 'non_food_product'
    
    # Seller Registration Info
    if any(word in message_lower for word in ['sell', 'become seller', 'seller registration', 'register seller', 'start selling', 'want to sell', 'become a seller']):
        return 'seller_registration'
    
    # Delivery Agent Registration
    if any(word in message_lower for word in ['become agent', 'delivery agent registration', 'register delivery', 'delivery job', 'work as delivery', 'join delivery', 'delivery register', 'delivery rejister', 'agent registration', 'delivery agent register']):
        return 'delivery_registration'
    
    # Check if looks like a product name (nouns, food items)
    food_categories = ['vegetable', 'vegetables', 'meat', 'fish', 'dairy', 'fruit', 'fruits', 
                       'chicken', 'mutton', 'egg', 'eggs', 'milk', 'cheese', 'butter',
                       'onion', 'tomato', 'potato', 'carrot', 'cabbage', 'spinach',
                       'apple', 'banana', 'mango', 'orange', 'grape', 'grapes']
    if any(food in message_lower for food in food_categories):
        return 'product_search'
    
    # If message is a single word, could be product search
    if len(words) == 1 and len(message_lower) > 2:
        return 'product_search'
    
    # Default to FAQ search
    return 'faq'

# Extract Product Name from Message
def extract_product_name(message):
    """Extract product name from user message"""
    # Remove common words and query words
    stop_words = [
        'price', 'of', 'show', 'me', 'find', 'buy', 'want', 'looking', 'for', 'the', 'a', 'an', 'some',
        'review', 'reviews', 'rating', 'ratings', 'feedback', 'quality', 'what', 'are', 'is', 'about',
        'tell', 'info', 'information', 'details', 'how', 'good', 'bad', 'best', 'cheap', 'fresh'
    ]
    words = message.lower().split()
    product_words = [w for w in words if w not in stop_words]
    result = ' '.join(product_words).strip()
    print(f"🔍 Extracted product name: '{result}' from message: '{message}'")
    return result if result else message

# Search Products
def search_products(query, limit=3):
    """Search for products using fuzzy matching"""
    try:
        # Get all approved products with complete details
        all_products = list(products_collection.find(
            {'approvalStatus': 'Approved'},
            {
                '_id': 1,
                'productName': 1,
                'sellingPrice': 1,
                'images': 1,
                'category': 1,
                'description': 1,
                'unit': 1,
                'stockQuantity': 1,
                'sellerName': 1,
                'storeName': 1,
                'features': 1,
                'preparationTime': 1,
                'freshnessGuarantee': 1
            }
        ))
        
        # Fuzzy match products
        scored_products = []
        for product in all_products:
            score = fuzz.partial_ratio(query.lower(), product['productName'].lower())
            # Also check category match
            if product.get('category'):
                category_score = fuzz.partial_ratio(query.lower(), product['category'].lower())
                score = max(score, category_score)
            
            if score > 50:  # Threshold for relevance
                scored_products.append((score, product))
        
        # Sort by score and return top results
        scored_products.sort(reverse=True, key=lambda x: x[0])
        return [p[1] for p in scored_products[:limit]]
    except Exception as e:
        print(f"Error searching products: {e}")
        return []

# Get Detailed User Orders
def get_detailed_orders(user_id, limit=1):
    """Get user's recent orders with complete details"""
    try:
        print(f"🔍 Searching for orders with userId: {user_id}")
        
        # Try to find orders
        orders = list(orders_collection.find(
            {'userId': user_id},
            {
                '_id': 1,
                'userId': 1,
                'status': 1,
                'deliveryOtp': 1,
                'createdAt': 1,
                'totalAmount': 1,
                'items': 1,
                'shippingAddress': 1,
                'paymentMethod': 1,
                'paymentStatus': 1,
                'taxDetails': 1
            }
        ).sort('createdAt', -1).limit(limit))
        
        print(f"📊 Found {len(orders)} orders for user {user_id}")
        
        if not orders:
            # Debug: Check what userIds exist in the database
            sample_orders = list(orders_collection.find({}, {'userId': 1, '_id': 0}).limit(5))
            print(f"📋 Sample userIds in database: {[o.get('userId') for o in sample_orders]}")
        
        # Format dates
        for order in orders:
            if order.get('createdAt'):
                order['createdAt'] = order['createdAt'].strftime('%d %b %Y, %I:%M %p')
        
        return orders
    except Exception as e:
        print(f"❌ Error fetching detailed orders: {e}")
        import traceback
        traceback.print_exc()
        return []

# Get User Cart
def get_user_cart(user_id):
    """Get user's shopping cart"""
    try:
        print(f"🛒 Fetching cart for user: {user_id}")
        cart = cart_collection.find_one({'userId': user_id})
        
        if cart and cart.get('items'):
            total = sum(item.get('price', 0) * item.get('quantity', 0) for item in cart['items'])
            return {
                'items': cart['items'],
                'total': total,
                'itemCount': len(cart['items'])
            }
        return None
    except Exception as e:
        print(f"❌ Error fetching cart: {e}")
        return None

# Get Product Reviews
def get_product_reviews(product_name):
    """Get reviews for a specific product or all recent reviews"""
    try:
        print(f"⭐ Searching reviews for: '{product_name}'")
        
        # If no specific product, show all recent reviews
        if not product_name or product_name.strip() == '':
            print("📋 No specific product, showing all recent reviews")
            reviews = list(reviews_collection.find(
                {},
                {
                    'userId': 1,
                    'productRate': 1,
                    'qualityRate': 1,
                    'overallRate': 1,
                    'deliveryRate': 1,
                    'reviewText': 1,
                    'likeFeatures': 1,
                    'deliveryReview': 1,
                    'createdAt': 1
                }
            ).sort('createdAt', -1).limit(5))
            
            if reviews:
                avg_rating = sum(r.get('overallRate', 0) for r in reviews if r.get('overallRate')) / max(len([r for r in reviews if r.get('overallRate')]), 1)
                return {
                    'productName': 'Recent Customer Reviews',
                    'reviews': reviews,
                    'averageRating': round(avg_rating, 1),
                    'reviewCount': len(reviews)
                }
            return None
        
        # First, find the product to get its ID
        product = products_collection.find_one(
            {'productName': {'$regex': product_name, '$options': 'i'}},
            {'_id': 1, 'productName': 1}
        )
        
        # Get all reviews (we'll show general reviews if no product-specific ones)
        reviews = list(reviews_collection.find(
            {},
            {
                'userId': 1,
                'productRate': 1,
                'qualityRate': 1,
                'overallRate': 1,
                'deliveryRate': 1,
                'reviewText': 1,
                'likeFeatures': 1,
                'deliveryReview': 1,
                'createdAt': 1
            }
        ).sort('createdAt', -1).limit(5))
        
        print(f"📊 Found {len(reviews)} reviews in database")
        
        if reviews:
            avg_rating = sum(r.get('overallRate', 0) for r in reviews if r.get('overallRate')) / max(len([r for r in reviews if r.get('overallRate')]), 1)
            return {
                'productName': product['productName'] if product else 'FreshCart Products',
                'reviews': reviews,
                'averageRating': round(avg_rating, 1),
                'reviewCount': len(reviews)
            }
        return None
    except Exception as e:
        print(f"❌ Error fetching reviews: {e}")
        import traceback
        traceback.print_exc()
        return None

# Get Order History
def get_order_history(user_id, limit=5):
    """Get user's order history"""
    try:
        print(f"📜 Fetching order history for user: {user_id}")
        orders = list(orders_collection.find(
            {'userId': user_id},
            {
                '_id': 1,
                'status': 1,
                'totalAmount': 1,
                'createdAt': 1,
                'items': 1
            }
        ).sort('createdAt', -1).limit(limit))
        
        # Format dates
        for order in orders:
            if order.get('createdAt'):
                order['createdAt'] = order['createdAt'].strftime('%d %b %Y')
        
        return orders
    except Exception as e:
        print(f"❌ Error fetching order history: {e}")
        return []

# Search FAQs
def search_faq(query):
    """Search FAQ database for matching questions"""
    try:
        # Try exact match first
        faq = faqs_collection.find_one({'question': {'$regex': query, '$options': 'i'}})
        if faq:
            return faq['answer']
        
        # Fuzzy match
        all_faqs = list(faqs_collection.find())
        best_match = None
        best_score = 0
        
        for faq in all_faqs:
            score = fuzz.partial_ratio(query.lower(), faq['question'].lower())
            if score > best_score:
                best_score = score
                best_match = faq
        
        if best_match and best_score > 60:
            return best_match['answer']
        
        return None
    except Exception as e:
        print(f"Error searching FAQs: {e}")
        return None

# Get All Products with Pagination
def get_all_products(page=1, per_page=5):
    """Get all products with pagination"""
    try:
        skip = (page - 1) * per_page
        
        # Get total count
        total_count = products_collection.count_documents({'approvalStatus': 'Approved'})
        
        # Get products for current page
        products = list(products_collection.find(
            {'approvalStatus': 'Approved'},
            {
                'productName': 1,
                'sellingPrice': 1,
                'category': 1,
                'unit': 1,
                'stockQuantity': 1,
                'description': 1
            }
        ).sort('productName', 1).skip(skip).limit(per_page))
        
        total_pages = (total_count + per_page - 1) // per_page
        has_next = page < total_pages
        
        return {
            'products': products,
            'page': page,
            'per_page': per_page,
            'total': total_count,
            'total_pages': total_pages,
            'has_next': has_next
        }
    except Exception as e:
        print(f"Error getting all products: {e}")
        return None

# Get All Stores/Sellers
def get_all_stores():
    """Get all stores/sellers from database"""
    try:
        # Try stores collection first
        stores = list(stores_collection.find(
            {},
            {
                'storeName': 1,
                'storeAddress': 1,
                'ownerName': 1,
                'category': 1,
                'status': 1
            }
        ).limit(10))
        
        if stores:
            return {'type': 'stores', 'data': stores}
        
        # If no stores, try getting sellers from sellers/products
        sellers = list(sellers_collection.find(
            {},
            {
                'name': 1,
                'storeName': 1,
                'storeAddress': 1,
                'email': 1,
                'status': 1
            }
        ).limit(10))
        
        if sellers:
            return {'type': 'sellers', 'data': sellers}
        
        # If no separate stores/sellers, get unique sellers from products
        unique_sellers = products_collection.aggregate([
            {'$match': {'approvalStatus': 'Approved'}},
            {'$group': {
                '_id': '$sellerId',
                'sellerName': {'$first': '$sellerName'},
                'storeName': {'$first': '$storeName'},
                'storeAddress': {'$first': '$storeAddress'}
            }},
            {'$limit': 10}
        ])
        
        return {'type': 'product_sellers', 'data': list(unique_sellers)}
    except Exception as e:
        print(f"Error getting stores: {e}")
        import traceback
        traceback.print_exc()
        return None

# Get Delivery Info
def get_delivery_info():
    """Get delivery agents and delivery information"""
    try:
        # Try to get delivery agents
        agents = list(delivery_agents_collection.find(
            {},
            {
                'name': 1,
                'phone': 1,
                'email': 1,
                'status': 1,
                'vehicleType': 1,
                'area': 1
            }
        ).limit(5))
        
        if agents:
            return {'type': 'agents', 'data': agents, 'count': len(agents)}
        
        # Return general delivery info if no agents found
        return {
            'type': 'info',
            'data': {
                'delivery_time': '30-45 minutes',
                'delivery_fee': 'Free above ₹199',
                'areas': ['Local delivery within 10km'],
                'working_hours': '8:00 AM - 10:00 PM'
            }
        }
    except Exception as e:
        print(f"Error getting delivery info: {e}")
        return {
            'type': 'info',
            'data': {
                'delivery_time': '30-45 minutes',
                'delivery_fee': 'Free above ₹199',
                'areas': ['Local delivery within 10km'],
                'working_hours': '8:00 AM - 10:00 PM'
            }
        }

# Get Product Categories and Popular Products
def get_product_showcase():
    """Get product categories with sample products for customer showcase"""
    try:
        # Get distinct categories
        categories = products_collection.distinct('category', {'approvalStatus': 'Approved'})
        
        # Get popular products (top sellers)
        popular_products = list(products_collection.find(
            {'approvalStatus': 'Approved'},
            {
                'productName': 1,
                'sellingPrice': 1,
                'category': 1,
                'unit': 1,
                'stockQuantity': 1
            }
        ).sort('orderCount', -1).limit(6))
        
        # Get products by category (sample from each)
        category_products = {}
        for cat in categories[:5]:  # Top 5 categories
            products = list(products_collection.find(
                {'approvalStatus': 'Approved', 'category': cat},
                {'productName': 1, 'sellingPrice': 1, 'unit': 1}
            ).limit(3))
            if products:
                category_products[cat] = products
        
        return {
            'categories': categories,
            'popular': popular_products,
            'byCategory': category_products
        }
    except Exception as e:
        print(f"Error getting product showcase: {e}")
        return None

@app.route('/api/chat', methods=['POST'])
def chat():
    """Main chat endpoint with enhanced intelligence"""
    try:
        data = request.json
        message = data.get('message', '')
        user_id = data.get('userId', None)
        
        print(f"\n{'='*50}")
        print(f"📨 New chat message: {message}")
        print(f"👤 User ID: {user_id}")
        print(f"{'='*50}\n")
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Classify intent
        intent = classify_intent(message)
        
        # Handle based on intent
        if intent == 'greeting':
            return jsonify({
                'type': 'text',
                'message': '👋 Hello! Welcome to FreshCart. I can help you with:\n• Finding fresh products (vegetables, meat, fish, dairy)\n• Checking prices and product details\n• Tracking your orders with delivery information\n• Answering questions about your purchases\n\nWhat would you like to know?'
            })
        
        # Navigation Commands
        elif intent == 'nav_cart':
            return jsonify({
                'type': 'navigation',
                'action': 'cart',
                'message': '🛒 **Opening Your Cart...**\n\n' +
                    '👉 Click the **Cart icon** in the top right corner\n' +
                    'Or go to: **/cart**\n\n' +
                    '💡 You can also type **"my cart"** to see cart items here!'
            })
        
        elif intent == 'nav_orders':
            return jsonify({
                'type': 'navigation',
                'action': 'orders',
                'message': '📦 **Your Orders**\n\n' +
                    '👉 Click **Profile > My Orders** in the menu\n' +
                    'Or go to: **/orders**\n\n' +
                    '📋 Type **"history"** to see order history here!\n' +
                    '🚚 Type **"track my order"** to track your latest delivery!'
            })
        
        elif intent == 'nav_logout':
            return jsonify({
                'type': 'navigation',
                'action': 'logout',
                'message': '👋 **Logging Out...**\n\n' +
                    '👉 Click **Profile icon** in the top right\n' +
                    '👉 Select **"Logout"** from the dropdown\n\n' +
                    '⚠️ Note: Your cart items will be saved for next time!\n\n' +
                    'Thank you for shopping with FreshCart! 🙏'
            })
        
        elif intent == 'nav_login':
            if user_id:
                return jsonify({
                    'type': 'text',
                    'message': '✅ **You are already logged in!**\n\n' +
                        'You can now:\n' +
                        '• 🛒 Add items to cart\n' +
                        '• 📦 Track your orders\n' +
                        '• ⭐ Leave reviews\n\n' +
                        'Happy shopping! 🎉'
                })
            return jsonify({
                'type': 'navigation',
                'action': 'login',
                'message': '🔐 **Login to FreshCart**\n\n' +
                    '👉 Click **"Login"** in the top right corner\n' +
                    '👉 Or go to: **/login**\n\n' +
                    '📝 New user? Click **"Sign Up"** to create an account!\n\n' +
                    '✨ Benefits of logging in:\n' +
                    '• Save cart items\n' +
                    '• Track orders\n' +
                    '• Get personalized recommendations'
            })
        
        elif intent == 'nav_home':
            return jsonify({
                'type': 'navigation',
                'action': 'home',
                'message': '🏠 **Going to Home Page...**\n\n' +
                    '👉 Click the **FreshCart logo** in the header\n' +
                    'Or go to: **/**\n\n' +
                    '🛍️ Browse fresh products and deals on the home page!'
            })
        
        elif intent == 'add_to_cart':
            # Extract product name from message
            product_name = extract_product_name(message)
            products = search_products(product_name, limit=1)
            
            if products:
                p = products[0]
                return jsonify({
                    'type': 'add_to_cart',
                    'product': {
                        'id': str(p['_id']),
                        'name': p['productName'],
                        'price': p['sellingPrice'],
                        'image': p['images'][0] if p.get('images') else None
                    },
                    'message': f'🛒 **Add to Cart?**\n\n' +
                        f'**{p["productName"]}**\n' +
                        f'💰 Price: ₹{p["sellingPrice"]}/{p.get("unit", "pc")}\n\n' +
                        f'👉 Click **"Add to Cart"** on the product page\n' +
                        f'Or search for **"{p["productName"]}"** and add from there!'
                })
            else:
                return jsonify({
                    'type': 'text',
                    'message': '🔍 **Product not found**\n\n' +
                        'Please specify which product you want to add:\n' +
                        '• "add chicken to cart"\n' +
                        '• "add tomato in cart"\n\n' +
                        '📦 Type **"products"** to browse all available items!'
                })
        
        elif intent == 'stock_inquiry':
            # Extract product name from message
            product_name = extract_product_name(message)
            products = search_products(product_name, limit=3)
            
            if products:
                response = f'📦 **Stock Status for "{product_name}"**\n\n'
                
                for p in products:
                    stock_qty = p.get('stockQuantity', 0)
                    
                    # Determine stock status
                    if stock_qty <= 0:
                        stock_status = '🔴 **Out of Stock**'
                        stock_msg = 'Currently unavailable'
                    elif stock_qty <= 5:
                        stock_status = '🟡 **Low Stock**'
                        stock_msg = f'Only {stock_qty} left! Order soon!'
                    elif stock_qty <= 20:
                        stock_status = '🟢 **In Stock**'
                        stock_msg = f'{stock_qty} units available'
                    else:
                        stock_status = '🟢 **In Stock**'
                        stock_msg = f'{stock_qty}+ units available'
                    
                    response += f'**{p["productName"]}**\n'
                    response += f'{stock_status} - {stock_msg}\n'
                    response += f'💰 ₹{p["sellingPrice"]}/{p.get("unit", "pc")}\n\n'
                
                response += '🛒 Type **"add [product] to cart"** to add to your cart!'
                
                return jsonify({
                    'type': 'text',
                    'message': response
                })
            else:
                return jsonify({
                    'type': 'text',
                    'message': '🔍 **Product not found**\n\n' +
                        'Please specify a product name:\n' +
                        '• "chicken stock"\n' +
                        '• "is onion available"\n' +
                        '• "tomato availability"\n\n' +
                        '📦 Type **"products"** to see all available items!'
                })
        
        elif intent == 'help':
            return jsonify({
                'type': 'text',
                'message': '🤖 **FreshCart AI Assistant**\n\n' +
                    '📦 **Product Search**\n' +
                    '• Find products: "show chicken", "price of onion"\n' +
                    '• Browse all: "products" → "next"\n' +
                    '• View stores: "store"\n\n' +
                    '🛒 **Cart & Orders**\n' +
                    '• View cart: "my cart"\n' +
                    '• Track order: "track my order"\n' +
                    '• Order history: "history"\n\n' +
                    '🚚 **Delivery Info**\n' +
                    '• Delivery time: 30-45 minutes\n' +
                    '• Free delivery above ₹199\n' +
                    '• Working hours: 8AM - 10PM\n' +
                    '• Type "delivery" for more info\n\n' +
                    '� **Payment Methods**\n' +
                    '• UPI (GPay, PhonePe, Paytm)\n' +
                    '• Credit/Debit Cards\n' +
                    '• Cash on Delivery (COD)\n' +
                    '• Net Banking\n\n' +
                    '📋 **FreshCart Policies**\n' +
                    '• 100% Fresh Guarantee\n' +
                    '• Easy returns within 24 hours\n' +
                    '• Secure payments\n\n' +
                    '🤝 **Join Us**\n' +
                    '• Become a Seller: "sell"\n' +
                    '• Become Delivery Agent: "become agent"\n\n' +
                    '💬 Just ask me anything!'
            })
        
        elif intent == 'seller_registration':
            return jsonify({
                'type': 'text',
                'message': '🏪 **Become a FreshCart Seller!**\n\n' +
                    'Start selling your fresh products to thousands of customers!\n\n' +
                    '✅ **Benefits:**\n' +
                    '• Wide customer reach across the platform\n' +
                    '• Easy product listing & management\n' +
                    '• Secure & timely payments\n' +
                    '• Dedicated delivery support\n' +
                    '• Real-time sales analytics\n\n' +
                    '📝 **Register Now:**\n' +
                    '👉 [Click here to Register as Seller](https://fresh-cart-seller-registrations-m7e.vercel.app/seller-registration)\n\n' +
                    '📋 **Requirements:**\n' +
                    '• Valid business documents\n' +
                    '• Fresh product inventory\n' +
                    '• Bank account for payments\n\n' +
                    '💬 Need help? Contact support@freshcart.com'
            })
        
        elif intent == 'delivery_registration':
            return jsonify({
                'type': 'text',
                'message': '🚚 **Become a FreshCart Delivery Agent!**\n\n' +
                    'Join our delivery team and earn while you deliver!\n\n' +
                    '✅ **Benefits:**\n' +
                    '• Flexible working hours\n' +
                    '• Competitive pay per delivery\n' +
                    '• Weekly payouts\n' +
                    '• Incentives & bonuses\n' +
                    '• Insurance coverage\n\n' +
                    '📝 **Register Now:**\n' +
                    '👉 [Click here to Register as Delivery Agent](https://fresh-cart-seller-registrations-m7e.vercel.app/delivery-agent-registration)\n\n' +
                    '📋 **Requirements:**\n' +
                    '• Valid driving license\n' +
                    '• Two-wheeler or four-wheeler\n' +
                    '• Smartphone with internet\n' +
                    '• Age 18+ years\n\n' +
                    '💬 Need help? Contact delivery@freshcart.com'
            })
        
        elif intent == 'non_food_product':
            return jsonify({
                'type': 'text',
                'message': '🚫 **Sorry, FreshCart Only Sells Fresh Food Products!**\n\n' +
                    'We specialize in delivering fresh, quality food items only.\n\n' +
                    '✅ **What We Sell:**\n' +
                    '• 🥩 **Meat** - Chicken, Mutton, Beef, Pork\n' +
                    '• 🐟 **Fish & Seafood** - Fresh catch daily\n' +
                    '• 🥬 **Vegetables** - Farm-fresh veggies\n' +
                    '• 🥛 **Dairy** - Milk, Cheese, Butter, Yogurt\n' +
                    '• 🍎 **Fruits** - Seasonal & Exotic fruits\n' +
                    '• 🥚 **Eggs** - Farm fresh eggs\n' +
                    '• 🧂 **Ingredients** - Spices, Oils, Essentials\n\n' +
                    '❌ **We DO NOT Sell:**\n' +
                    '• Electronics, Mobiles, Laptops\n' +
                    '• Gold, Jewelry, Watches\n' +
                    '• Furniture, Vehicles, Property\n' +
                    '• Clothes, Cosmetics, Medicines\n\n' +
                    '🛒 Type **"products"** to browse our fresh items!'
            })
        
        elif intent == 'product_list':
            # Get page 1 of products
            result = get_all_products(page=1, per_page=5)
            
            if result and result['products']:
                # Store pagination state for this user
                session_key = user_id or 'anonymous'
                user_pagination_state[session_key] = {
                    'current_page': 1,
                    'total_pages': result['total_pages'],
                    'context': 'product_list'
                }
                
                response = f'📦 **All Products** (Page {result["page"]}/{result["total_pages"]})\n'
                response += f'📊 Showing {len(result["products"])} of {result["total"]} products\n\n'
                
                for i, p in enumerate(result['products'], 1):
                    stock_status = '✅' if p.get('stockQuantity', 0) > 0 else '❌ Out of Stock'
                    response += f'{i}. **{p["productName"]}**\n'
                    response += f'   💰 ₹{p.get("sellingPrice", "N/A")}/{p.get("unit", "pc")}\n'
                    response += f'   📂 {p.get("category", "General")} | {stock_status}\n\n'
                
                if result['has_next']:
                    response += '📖 Type **"next"** to see more products!'
                else:
                    response += '✅ That\'s all our products!'
                
                return jsonify({
                    'type': 'text',
                    'message': response
                })
            else:
                return jsonify({
                    'type': 'text',
                    'message': '😔 No products found. Please check back later!'
                })
        
        elif intent == 'pagination':
            session_key = user_id or 'anonymous'
            
            if session_key in user_pagination_state:
                state = user_pagination_state[session_key]
                next_page = state['current_page'] + 1
                
                if next_page <= state['total_pages']:
                    result = get_all_products(page=next_page, per_page=5)
                    
                    if result and result['products']:
                        # Update pagination state
                        user_pagination_state[session_key]['current_page'] = next_page
                        
                        response = f'📦 **All Products** (Page {result["page"]}/{result["total_pages"]})\n\n'
                        
                        for i, p in enumerate(result['products'], 1):
                            stock_status = '✅' if p.get('stockQuantity', 0) > 0 else '❌ Out of Stock'
                            response += f'{i}. **{p["productName"]}**\n'
                            response += f'   💰 ₹{p.get("sellingPrice", "N/A")}/{p.get("unit", "pc")}\n'
                            response += f'   📂 {p.get("category", "General")} | {stock_status}\n\n'
                        
                        if result['has_next']:
                            response += '📖 Type **"next"** to see more products!'
                        else:
                            response += '✅ That\'s all our products!'
                        
                        return jsonify({
                            'type': 'text',
                            'message': response
                        })
                else:
                    return jsonify({
                        'type': 'text',
                        'message': '✅ You\'ve seen all the products! Type **"products"** to start from the beginning.'
                    })
            else:
                return jsonify({
                    'type': 'text',
                    'message': '📦 Type **"products"** first to see the product list, then use **"next"** to see more!'
                })
        
        elif intent == 'delivery_inquiry':
            delivery_data = get_delivery_info()
            
            if delivery_data['type'] == 'agents':
                response = '🚚 **Delivery Information**\n\n'
                response += f'📊 Active Delivery Partners: {delivery_data["count"]}\n\n'
                
                for i, agent in enumerate(delivery_data['data'], 1):
                    name = agent.get('name') or 'Delivery Agent'
                    vehicle = agent.get('vehicleType') or 'Bike'
                    status = '🟢 Active' if agent.get('status') == 'active' else '🔴 Offline'
                    
                    response += f'{i}. **{name}**\n'
                    response += f'   🚗 Vehicle: {vehicle}\n'
                    response += f'   {status}\n\n'
                
                response += '💡 Your order will be delivered by one of our trusted partners!'
            else:
                info = delivery_data['data']
                response = '🚚 **Delivery Information**\n\n'
                response += f'⏱️ **Delivery Time:** {info["delivery_time"]}\n'
                response += f'💸 **Delivery Fee:** {info["delivery_fee"]}\n'
                response += f'🕐 **Working Hours:** {info["working_hours"]}\n'
                response += f'📍 **Service Area:** {", ".join(info["areas"])}\n\n'
                response += '📦 We deliver fresh groceries right to your doorstep!\n'
                response += '💡 Track your order anytime by typing "track my order"'
            
            return jsonify({
                'type': 'text',
                'message': response
            })
        
        elif intent == 'store_inquiry':
            stores_data = get_all_stores()
            
            if stores_data and stores_data['data']:
                response = '🏪 **Our Partner Stores**\n\n'
                response += f'📊 Found {len(stores_data["data"])} stores\n\n'
                
                for i, store in enumerate(stores_data['data'], 1):
                    # Handle different data formats
                    store_name = store.get('storeName') or store.get('name') or store.get('sellerName') or 'Unknown Store'
                    store_address = store.get('storeAddress') or store.get('address') or 'Address not available'
                    
                    response += f'{i}. **{store_name}**\n'
                    response += f'   📍 {store_address}\n'
                    
                    if store.get('category'):
                        response += f'   📂 {store["category"]}\n'
                    if store.get('ownerName'):
                        response += f'   👤 Owner: {store["ownerName"]}\n'
                    response += '\n'
                
                response += '💡 **Tip:** Search for products by name to see items from these stores!'
                
                return jsonify({
                    'type': 'text',
                    'message': response
                })
            else:
                return jsonify({
                    'type': 'text',
                    'message': '🏪 **Our Stores**\n\nWe have multiple partner stores selling fresh products!\n\n💡 Try searching for specific products like:\n• "chicken" - Fresh Chicken Store\n• "vegetables" - Fresh Veggie Mart\n• "fish" - Seafood Paradise'
                })
        
        elif intent == 'cart_inquiry':
            if not user_id:
                return jsonify({
                    'type': 'text',
                    'message': '🔐 Please log in to view your cart.'
                })
            
            cart = get_user_cart(user_id)
            
            if cart:
                cart_msg = f'🛒 **Your Shopping Cart**\n\n'
                cart_msg += f'📊 Items: {cart["itemCount"]}\n\n'
                
                for i, item in enumerate(cart['items'][:5], 1):
                    cart_msg += f'{i}. **{item.get("productName", "Unknown")}**\n'
                    cart_msg += f'   💰 ₹{item.get("price", 0)} x {item.get("quantity", 1)} = ₹{item.get("price", 0) * item.get("quantity", 1)}\n'
                    if item.get('stock', 0) > 0:
                        cart_msg += f'   ✅ In Stock\n'
                    else:
                        cart_msg += f'   ⚠️ Low Stock\n'
                    cart_msg += '\n'
                
                if len(cart['items']) > 5:
                    cart_msg += f'...and {len(cart["items"]) - 5} more items\n\n'
                
                cart_msg += f'� **Total: ₹{cart["total"]}**\n\n'
                cart_msg += '🎯 Ready to checkout? Head to your cart!'
                
                return jsonify({
                    'type': 'text',
                    'message': cart_msg
                })
            else:
                return jsonify({
                    'type': 'text',
                    'message': '🛒 Your cart is empty!\n\n🛍️ Start shopping for:\n• Fresh Vegetables\n• Premium Meat & Fish\n• Dairy Products\n• Seasonal Fruits'
                })
        
        elif intent == 'review_inquiry':
            # Extract product name from message
            product_name = extract_product_name(message)
            reviews_data = get_product_reviews(product_name)
            
            if reviews_data:
                review_msg = f'⭐ **Reviews for {reviews_data["productName"]}**\n\n'
                review_msg += f'📊 Average Rating: {reviews_data["averageRating"]}/5 ({reviews_data["reviewCount"]} reviews)\n\n'
                
                for i, review in enumerate(reviews_data['reviews'][:3], 1):
                    stars = '⭐' * int(review.get('overallRate', 0))
                    review_msg += f'{i}. {stars} ({review.get("overallRate", 0)}/5)\n'
                    review_msg += f'   "{review.get("reviewText", "No comment")[:100]}..."\n'
                    if review.get('likeFeatures'):
                        review_msg += f'   👍 Liked: {", ".join(review["likeFeatures"][:2])}\n'
                    review_msg += '\n'
                
                return jsonify({
                    'type': 'text',
                    'message': review_msg
                })
            else:
                return jsonify({
                    'type': 'text',
                    'message': f'😔 No reviews found for "{product_name}".\n\nTry searching for a specific product or browse our catalog!'
                })
        
        elif intent == 'product_search':
            product_name = extract_product_name(message)
            products = search_products(product_name)
            
            if products:
                # Enhanced product information
                detailed_message = f'🛒 Found {len(products)} products matching "{product_name}":\n\n'
                for i, p in enumerate(products, 1):
                    stock_status = "✅ In Stock" if p.get('stockQuantity', 0) > 0 else "❌ Out of Stock"
                    detailed_message += f'{i}. **{p["productName"]}**\n'
                    detailed_message += f'   💰 Price: ₹{p["sellingPrice"]}/{p.get("unit", "piece")}\n'
                    detailed_message += f'   📊 Stock: {stock_status}\n'
                    if p.get('description'):
                        detailed_message += f'   📝 {p["description"][:100]}...\n'
                    detailed_message += '\n'
                
                return jsonify({
                    'type': 'products',
                    'message': detailed_message,
                    'products': [{
                        'id': str(p['_id']),
                        'name': p['productName'],
                        'price': p['sellingPrice'],
                        'image': p['images'][0] if p.get('images') else None,
                        'category': p.get('category', ''),
                        'unit': p.get('unit', 'piece'),
                        'stock': p.get('stockQuantity', 0),
                        'description': p.get('description', ''),
                        'seller': p.get('sellerName', 'FreshCart'),
                        'store': p.get('storeName', 'FreshCart Store')
                    } for p in products]
                })
            else:
                return jsonify({
                    'type': 'text',
                    'message': f'😔 Sorry, I couldn\'t find any products matching "{product_name}".\n\nTry searching for:\n• Vegetables (onion, tomato, potato)\n• Meat (chicken, mutton, fish)\n• Dairy (milk, cheese, yogurt)\n• Fruits (apple, banana, mango)'
                })
        
        elif intent == 'order_tracking':
            if not user_id:
                return jsonify({
                    'type': 'text',
                    'message': '🔐 Please log in to track your orders.\n\nOnce logged in, I can show you:\n• Order status and tracking\n• Delivery OTP\n• Shipping address\n• Payment details\n• Order history'
                })
            
            # Check if user wants order history
            if any(word in message.lower() for word in ['history', 'all orders', 'past orders', 'previous orders']):
                orders = get_order_history(user_id, limit=5)
                
                if orders:
                    history_msg = f'📜 **Your Order History**\n\n'
                    history_msg += f'Showing last {len(orders)} orders:\n\n'
                    
                    for i, order in enumerate(orders, 1):
                        status_emoji = {
                            'Delivered': '✅',
                            'Out for Delivery': '🚚',
                            'Processing': '⏳',
                            'Placed': '📦'
                        }.get(order.get('status', ''), '📦')
                        
                        history_msg += f'{i}. {status_emoji} Order #{str(order["_id"])[-6:].upper()}\n'
                        history_msg += f'   📅 {order.get("createdAt", "N/A")}\n'
                        history_msg += f'   📊 Status: {order.get("status", "Unknown")}\n'
                        history_msg += f'   💰 Total: ₹{order.get("totalAmount", 0)}\n'
                        history_msg += f'   🛍️ Items: {len(order.get("items", []))}\n\n'
                    
                    history_msg += '💡 Type "track my order" to see details of your latest order!'
                    
                    return jsonify({
                        'type': 'text',
                        'message': history_msg
                    })
                else:
                    return jsonify({
                        'type': 'text',
                        'message': '📭 No order history found.\n\n🛒 Start shopping to create your first order!'
                    })
            
            # Get detailed order information for latest order
            orders = get_detailed_orders(user_id, limit=1)
            
            if orders:
                order = orders[0]
                
                # Build comprehensive order message
                order_msg = f'📦 **Order Details**\n\n'
                order_msg += f'🆔 Order ID: #{str(order["_id"])[-8:].upper()}\n'
                order_msg += f'📅 Placed: {order.get("createdAt", "N/A")}\n'
                order_msg += f'📊 Status: **{order.get("status", "Unknown")}**\n\n'
                
                # Items
                items = order.get('items', [])
                order_msg += f'🛍️ **Items ({len(items)})**:\n'
                for i, item in enumerate(items[:3], 1):  # Show first 3 items
                    order_msg += f'{i}. {item.get("productName", "Unknown")} x{item.get("quantity", 1)} - ₹{item.get("price", 0)}\n'
                if len(items) > 3:
                    order_msg += f'   ...and {len(items) - 3} more items\n'
                
                # Delivery Address
                shipping = order.get('shippingAddress', {})
                if shipping:
                    order_msg += f'\n📍 **Delivery Address**:\n'
                    order_msg += f'{shipping.get("name", "")}\n'
                    order_msg += f'{shipping.get("houseNumber", "")} {shipping.get("street", "")}\n'
                    order_msg += f'{shipping.get("city", "")}, {shipping.get("state", "")} - {shipping.get("zipCode", "")}\n'
                
                # Payment
                order_msg += f'\n💳 **Payment**:\n'
                order_msg += f'Method: {order.get("paymentMethod", "N/A")}\n'
                order_msg += f'Status: {order.get("paymentStatus", "N/A")}\n'
                order_msg += f'Total: ₹{order.get("totalAmount", 0)}\n'
                
                # Delivery OTP
                if order.get('deliveryOtp') and order.get('status') != 'Delivered':
                    order_msg += f'\n🔑 **Delivery OTP**: {order["deliveryOtp"]}\n'
                    order_msg += '(Share this with the delivery agent)\n'
                
                return jsonify({
                    'type': 'order',
                    'message': order_msg,
                    'order': {
                        'id': str(order['_id']),
                        'status': order.get('status', 'Unknown'),
                        'otp': order.get('deliveryOtp', 'N/A'),
                        'total': order.get('totalAmount', 0),
                        'items': len(items),
                        'paymentMethod': order.get('paymentMethod', 'N/A'),
                        'paymentStatus': order.get('paymentStatus', 'N/A'),
                        'address': f"{shipping.get('city', '')}, {shipping.get('state', '')}" if shipping else 'N/A'
                    }
                })
            else:
                return jsonify({
                    'type': 'text',
                    'message': '📭 You don\'t have any orders yet.\n\n🛒 Start shopping for fresh:\n• Vegetables\n• Meat & Fish\n• Dairy Products\n• Fruits\n\nAll delivered fresh to your doorstep!'
                })
        
        elif intent == 'seller_info':
            return jsonify({
                'type': 'text',
                'message': '👨‍🌾 **Become a FreshCart Seller!**\n\nSell your fresh products and reach thousands of customers.\n\n✅ Benefits:\n• Wide customer reach\n• Easy product management\n• Secure payments\n• Delivery support\n\n📝 Click "Become a Seller" in the footer to register!'
            })
        
        else:
            # Enhanced FAQ search with product context
            faq_answer = search_faq(message)
            if faq_answer:
                return jsonify({
                    'type': 'text',
                    'message': faq_answer
                })
            else:
                # Try to extract product-related questions
                if any(word in message.lower() for word in ['what is', 'tell me about', 'info about', 'details of']):
                    product_name = extract_product_name(message)
                    products = search_products(product_name, limit=1)
                    
                    if products:
                        p = products[0]
                        response = f'📦 **{p["productName"]}**\n\n'
                        response += f'💰 Price: ₹{p["sellingPrice"]}/{p.get("unit", "piece")}\n'
                        response += f'📂 Category: {p.get("category", "N/A")}\n'
                        if p.get('description'):
                            response += f'📝 Description: {p["description"]}\n'
                        if p.get('features'):
                            response += f'\n✨ Features:\n'
                            for feature in p['features'][:3]:
                                response += f'• {feature}\n'
                        response += f'\n🏪 Seller: {p.get("sellerName", "FreshCart")}\n'
                        response += f'📊 Stock: {"Available" if p.get("stockQuantity", 0) > 0 else "Out of Stock"}'
                        
                        return jsonify({
                            'type': 'text',
                            'message': response
                        })
                
                # Try to find products as a fallback - smart product showcase
                showcase = get_product_showcase()
                
                if showcase and (showcase.get('categories') or showcase.get('popular')):
                    response = '🛒 **Welcome to FreshCart!**\n\n'
                    response += 'Here\'s what we have available:\n\n'
                    
                    # Show categories
                    if showcase.get('categories'):
                        response += '📂 **Categories:**\n'
                        for cat in showcase['categories'][:6]:
                            response += f'• {cat}\n'
                        response += '\n'
                    
                    # Show popular products
                    if showcase.get('popular'):
                        response += '🌟 **Popular Products:**\n'
                        for p in showcase['popular'][:4]:
                            stock_status = '✅' if p.get('stockQuantity', 0) > 0 else '❌'
                            response += f'{stock_status} {p["productName"]} - ₹{p.get("sellingPrice", "N/A")}/{p.get("unit", "pc")}\n'
                        response += '\n'
                    
                    response += '💡 **Try asking:**\n'
                    response += '• "Show me vegetables"\n'
                    response += '• "Price of chicken"\n'
                    response += '• "Track my order"\n'
                    response += '• "What\'s in my cart?"\n'
                    response += '• "Show reviews"'
                    
                    return jsonify({
                        'type': 'text',
                        'message': response
                    })
                
                return jsonify({
                    'type': 'text',
                    'message': '🛒 **Welcome to FreshCart!**\n\nI can help you with:\n\n📦 **Products** - "Show me vegetables", "Price of chicken"\n🛒 **Cart** - "What\'s in my cart?"\n📜 **Orders** - "Track my order", "Order history"\n⭐ **Reviews** - "Show reviews"\n\nJust type what you\'re looking for!'
                })
    
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'FreshCart Chatbot'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5010)
