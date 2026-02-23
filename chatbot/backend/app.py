"""
app.py
------
Main entry point for the FreshCart Chatbot backend.
Refactored into a modular structure with separate files for database,
algorithms, and handlers.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv

# Import modular components
from config.database import products_collection, orders_collection, cart_collection
from algorithms.intent import classify_intent
from algorithms.sets import extract_price_bounds, extract_compare_products, tokenize
from utils.helpers import extract_product_name

# Import handlers
from handlers.product import (
    search_products, compare_products, get_products_by_price_range,
    get_best_deals, get_categories_list, get_all_products, get_product_showcase
)
from handlers.order import get_detailed_orders, get_order_history
from handlers.cart import get_user_cart
from handlers.review import get_product_reviews
from handlers.store import get_all_stores
from handlers.delivery import get_delivery_info, get_live_tracking_info
from handlers.user import get_user_addresses, format_address
from handlers.support import (
    get_user_reports, get_seller_notifications, get_policy_info, 
    get_tax_info, create_report
)
from handlers.faq import search_faq, get_nutrition_info, handle_greeting, handle_help
from handlers.navigation import (
    handle_nav_cart, handle_nav_orders, handle_nav_logout,
    handle_nav_login, handle_nav_home
)

# Initialize Flask app
app = Flask(__name__)
CORS(app)
load_dotenv()

@app.route('/api/chat', methods=['POST'])
def chat():
    """Main chat endpoint with modularized intelligence"""
    try:
        data = request.json
        message = data.get('message', '')
        user_id = data.get('userId', None)
        
        print(f"\n📨 NEW MESSAGE: {message} | USER: {user_id}")
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # 1. Classify Intent (O(1) Set-based Engine)
        intent = classify_intent(message)
        print(f"🎯 INTENT: {intent}")
        
        # 2. Handle based on intent
        if intent == 'greeting':
            return jsonify(handle_greeting())
        
        # Navigation
        elif intent == 'nav_cart':   return handle_nav_cart()
        elif intent == 'nav_orders': return handle_nav_orders()
        elif intent == 'nav_logout': return handle_nav_logout()
        elif intent == 'nav_login':  return handle_nav_login(user_id)
        elif intent == 'nav_home':   return handle_nav_home()
        
        # Product Operations
        elif intent == 'add_to_cart':
            product_name = extract_product_name(message)
            products = search_products(product_name, limit=1)
            if products:
                p = products[0]
                return jsonify({
                    'type': 'add_to_cart',
                    'product': {'id': str(p['_id']), 'name': p['productName'], 'price': p['sellingPrice'], 'image': p['images'][0] if p.get('images') else None},
                    'message': f'🛒 **Add to Cart?**\n\n**{p["productName"]}**\n💰 Price: ₹{p["sellingPrice"]}/{p.get("unit", "pc")}\n\n👉 Click **"Add to Cart"** on the product page!'
                })
            return jsonify({'type': 'text', 'message': '🔍 **Product not found.** Try searching for a specific item!'})
        
        elif intent == 'stock_inquiry':
            product_name = extract_product_name(message)
            products = search_products(product_name, limit=3)
            if products:
                res = f'📦 **Stock Status for "{product_name}"**\n\n'
                for p in products:
                    qty = p.get('stockQuantity', 0)
                    status = '🟢 **In Stock**' if qty > 5 else ('🟡 **Low Stock**' if qty > 0 else '🔴 **Out of Stock**')
                    res += f'**{p["productName"]}**\n{status} - {qty} units\n💰 ₹{p["sellingPrice"]}\n\n'
                return jsonify({'type': 'text', 'message': res + '🛒 Type **"add [product] to cart"** to order!'})
            return jsonify({'type': 'text', 'message': '🔍 **Product not found.**'})

        # Set-Algorithm Powered Intents
        elif intent == 'product_compare':
            p1, p2 = extract_compare_products(message)
            result = compare_products(p1, p2)
            if result:
                msg = f"⚖️ **Comparison: {p1} vs {p2}**\n\n"
                msg += f"💰 **Price:** {p1}: ₹{result['product1'].get('sellingPrice')} | {p2}: ₹{result['product2'].get('sellingPrice')}\n"
                msg += f"📦 **Better Value:** {result['cheaper']} is cheaper!\n"
                return jsonify({'type': 'text', 'message': msg})
            return jsonify({'type': 'text', 'message': '😔 Could not find both products to compare.'})

        elif intent == 'price_range':
            bounds = extract_price_bounds(message)
            products = get_products_by_price_range(min_price=bounds['min'], max_price=bounds['max'])
            if products:
                msg = "💰 **Products in your budget:**\n\n"
                for p in products: msg += f"• **{p['productName']}** — ₹{p['sellingPrice']}\n"
                return jsonify({'type': 'text', 'message': msg})
            return jsonify({'type': 'text', 'message': '😔 No products found in that range.'})

        elif intent == 'best_deals':
            products = get_best_deals()
            if products:
                msg = "🏷️ **Today's Best Deals!**\n\n"
                for p in products: msg += f"• **{p['productName']}** — ₹{p['sellingPrice']}\n"
                return jsonify({'type': 'text', 'message': msg})
            return jsonify({'type': 'text', 'message': '😔 No deals found.'})

        elif intent == 'nutrition_info':
            product_name = extract_product_name(message)
            key, info = get_nutrition_info(product_name)
            if info:
                msg = f"🥗 **Nutrition: {key.title()}**\n\n🔥 Calories: {info['calories']}\n💪 Protein: {info['protein']}\n💡 {info['benefits']}"
                return jsonify({'type': 'text', 'message': msg})
            return jsonify({'type': 'text', 'message': '🥗 Nutrition info not available for that item.'})

        elif intent == 'category_browse':
            cats = get_categories_list()
            msg = "📂 **Categories:**\n\n"
            for c, count in sorted(cats.items(), key=lambda x: x[1], reverse=True):
                msg += f"• **{c}** ({count} items)\n"
            return jsonify({'type': 'text', 'message': msg})

        elif intent == 'product_search':
            product_name = extract_product_name(message)
            products = search_products(product_name, limit=3)
            if products:
                res = f'🔍 **Products found for "{product_name}"**\n\n'
                for p in products:
                    res += f'**{p["productName"]}**\n💰 Price: ₹{p["sellingPrice"]}\n📂 {p.get("category", "General")}\n\n'
                return jsonify({'type': 'text', 'message': res + '🛒 Type **"add [product] to cart"** to order!'})
            return jsonify({'type': 'text', 'message': f'😔 Sorry, I couldn\'t find any products matching "{product_name}".'})

        elif intent == 'product_list':
            data = get_all_products(page=1)
            if data and data['products']:
                res = "📦 **All Products**\n\n"
                for p in data['products']:
                    res += f"• **{p['productName']}** — ₹{p['sellingPrice']}\n"
                return jsonify({'type': 'text', 'message': res + '\nType **"next"** to see more!'})
            return jsonify({'type': 'text', 'message': '📦 No products available.'})

        elif intent == 'pagination':
            # Simplified pagination for chat
            data = get_all_products(page=2)
            if data and data['products']:
                res = "📦 **More Products**\n\n"
                for p in data['products']: res += f"• **{p['productName']}** — ₹{p['sellingPrice']}\n"
                return jsonify({'type': 'text', 'message': res})
            return jsonify({'type': 'text', 'message': '📦 No more products.'})

        # Order & User Info
        elif intent == 'order_tracking':
            if not user_id: return jsonify({'type': 'text', 'message': '🔐 Please login to track your orders.'})
            orders = get_detailed_orders(user_id)
            if orders:
                o = orders[0]
                return jsonify({'type': 'text', 'message': f"🚚 **Order #{str(o['_id'])[-6:]}**\nStatus: **{o['status']}**\nTotal: ₹{o['totalAmount']}\nUpdated: {o['createdAt']}\n\n💡 Say **\"live track\"** to see current agent position!"})
            return jsonify({'type': 'text', 'message': '📦 No active orders found.'})

        elif intent == 'live_tracking':
            if not user_id: return jsonify({'type': 'text', 'message': '🔐 Please login to live track your order.'})
            track_info = get_live_tracking_info(user_id)
            if track_info:
                return jsonify({'type': 'text', 'message': track_info['message']})
            return jsonify({'type': 'text', 'message': '📦 No active deliveries found for live tracking at the moment.'})

        elif intent == 'cart_inquiry':
            if not user_id: return jsonify({'type': 'text', 'message': '🔐 Please login to view your cart.'})
            cart = get_user_cart(user_id)
            if cart:
                msg = f"🛒 **Your Cart ({cart['itemCount']} items)**\n\n"
                for item in cart['items']: msg += f"• {item['name']} x{item['quantity']} (₹{item['price']})\n"
                msg += f"\n💰 **Total: ₹{cart['total']}**"
                return jsonify({'type': 'text', 'message': msg})
            return jsonify({'type': 'text', 'message': '🛒 Your cart is empty.'})

        elif intent == 'review_inquiry':
            name = extract_product_name(message)
            rev = get_product_reviews(name)
            if rev:
                msg = f"⭐ **Reviews for {rev['productName']}**\nAverage: {rev['averageRating']} / 5\n\n"
                for r in rev['reviews'][:3]: msg += f"• {r.get('reviewText', 'No text')} ({r.get('overallRate')}⭐)\n"
                return jsonify({'type': 'text', 'message': msg})
            return jsonify({'type': 'text', 'message': '⭐ No reviews found for that product.'})

        elif intent == 'store_inquiry':
            data = get_all_stores()
            if data and data['data']:
                msg = "🏪 **Available Stores**\n\n"
                for s in data['data'][:5]: msg += f"• **{s.get('storeName', s.get('name'))}**\n"
                return jsonify({'type': 'text', 'message': msg})
            return jsonify({'type': 'text', 'message': '🏪 No stores found.'})

        elif intent == 'delivery_inquiry':
            info = get_delivery_info()
            if info['type'] == 'agents':
                msg = f"🚚 **Delivery Status**\nWe have {info['count']} agents available!\n"
                return jsonify({'type': 'text', 'message': msg})
            d = info['data']
            msg = f"🚚 **Delivery Info**\nTime: {d['delivery_time']}\nFee: {d['delivery_fee']}\nHours: {d['working_hours']}"
            return jsonify({'type': 'text', 'message': msg})

        elif intent == 'seller_registration':
            return jsonify({'type': 'text', 'message': '🏪 **Become a Seller!**\nVisit **/seller/register** to start your shop today!'})

        elif intent == 'delivery_registration':
            return jsonify({'type': 'text', 'message': '🚚 **Join our Delivery Team!**\nVisit **/delivery/join** to apply as an agent.'})

        elif intent == 'non_food_product':
            return jsonify({'type': 'text', 'message': '❌ **Sorry, we only sell fresh food items!**\nI cannot help you find electronics, clothing, or jewelry.'})

        elif intent == 'address_inquiry':
            if not user_id: return jsonify({'type': 'text', 'message': '🔐 Please login to see your saved addresses.'})
            addrs = get_user_addresses(user_id)
            if addrs:
                msg = "🏠 **Your Saved Addresses**\n\n"
                for i, a in enumerate(addrs, 1):
                    msg += f"{i}. {format_address(a)}\n"
                    if a.get('isDefault'): msg += "   (✅ Default Address)\n"
                return jsonify({'type': 'text', 'message': msg})
            return jsonify({'type': 'text', 'message': '🏠 You have no saved addresses. Add one in your profile!'})

        elif intent == 'notif_inquiry':
            if not user_id: return jsonify({'type': 'text', 'message': '🔐 Please login to check notifications.'})
            # Try as seller first (seller IDs in this project are usually same as user IDs in dev)
            notifs = get_seller_notifications(user_id)
            if notifs:
                msg = "🔔 **Your Notifications**\n\n"
                for n in notifs: msg += f"• {n['message']}\n"
                return jsonify({'type': 'text', 'message': msg})
            return jsonify({'type': 'text', 'message': '🔔 You have no new notifications.'})

        elif intent == 'report_issue':
            if not user_id: return jsonify({'type': 'text', 'message': '🔐 Please login to file or view reports.'})
            
            # Check if user is trying to submit a NEW report
            # If message contains "report" and more than 3 words, treat it as a submission
            message_words = message.lower().split()
            if 'report' in message_words and len(message_words) > 3:
                # Extract the description (everything after 'report')
                try:
                    desc_index = message_words.index('report') + 1
                    description = ' '.join(message.split()[desc_index:])
                except:
                    description = message
                
                report_id, err = create_report(user_id, description)
                if report_id:
                    return jsonify({
                        'type': 'text',
                        'message': f"📝 **Successfully Filed Report #{report_id}**\n\n" +
                            f"We have recorded your issue: *\"{description}\"*\n" +
                            "Our support team will review it and update the status in your **Support Dashboard**.\n\n" +
                            "👉 You can also manage reports here: [http://localhost:5174/report-issue](http://localhost:5174/report-issue)"
                    })
                return jsonify({'type': 'text', 'message': f"❌ **Error filing report:** {err}"})

            # Otherwise, just list recent reports
            reports = get_user_reports(user_id)
            msg = "📋 **Your Recent Issues/Reports**\n\n"
            if reports:
                for r in reports:
                    msg += f"• **{r['issueType']}** — Status: *{r.get('status', 'Pending')}*\n  Desc: {r['description'][:50]}...\n"
                msg += "\n👉 To file a NEW report, say: **\"report [description]\"**\n"
            else:
                msg += "You have no active reports.\n\n💡 **Want to report something?**\nSay: **\"report [tell me the problem]\"**\n"
            
            return jsonify({
                'type': 'text', 
                'message': msg + "Or visit: [http://localhost:5174/report-issue](http://localhost:5174/report-issue)"
            })

        elif intent == 'tax_inquiry':
            return jsonify({'type': 'text', 'message': get_tax_info()})

        elif intent == 'policy_inquiry':
            p_type = 'general'
            if 'refund' in message.lower(): p_type = 'refund'
            elif 'return' in message.lower(): p_type = 'return'
            elif 'cancel' in message.lower(): p_type = 'cancellation'
            return jsonify({'type': 'text', 'message': get_policy_info(p_type)})

        elif intent == 'dispatch_inquiry':
            try:
                ids_url = os.environ.get('IDS_CORE_API_URL', 'http://localhost:2012')
                resp = requests.get(f"{ids_url}/api/orders/pending", timeout=3)
                if resp.status_code == 200:
                    data = resp.json()
                    count = len(data.get('orders', []))
                    if count > 0:
                        msg = f"🧠 **Intelligent Dispatch System**\n\nThere are currently **{count}** orders in the dispatch queue waiting to be clustered and assigned to agents."
                    else:
                        msg = "🧠 **Intelligent Dispatch System**\n\nThe dispatch queue is currently empty. All orders have been assigned!"
                    return jsonify({'type': 'text', 'message': msg})
                return jsonify({'type': 'text', 'message': "🚚 The dispatch system is currently unreachable."})
            except Exception as e:
                return jsonify({'type': 'text', 'message': "🚚 Error connecting to the dispatch engine."})

        # Miscellaneous handlers
        elif intent == 'help': return jsonify(handle_help())
        
        # Fallback to FAQ
        answer = search_faq(message)
        if answer: return jsonify({'type': 'text', 'message': answer})
        
        return jsonify({'type': 'text', 'message': "🤖 I'm not sure about that. Try asking for 'help'!"})

    except Exception as e:
        print(f"❌ CHAT ERROR: {e}")
        return jsonify({'message': 'Error processing request'}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'FreshCart Chatbot'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5010))
    app.run(host='0.0.0.0', port=port, debug=True)
