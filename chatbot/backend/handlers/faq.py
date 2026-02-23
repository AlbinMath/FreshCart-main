"""
handlers/faq.py
---------------
Handlers for FAQ queries and nutritional information.
"""

from fuzzywuzzy import fuzz
from config.database import faqs_collection
from algorithms.sets import tokenize

NUTRITION_DB = {
    'chicken':  {'calories':'165 kcal/100g','protein':'31g','fat':'3.6g','carbs':'0g','benefits':'High protein, low fat, rich in B vitamins'},
    'mutton':   {'calories':'294 kcal/100g','protein':'25g','fat':'21g','carbs':'0g','benefits':'Rich in iron, zinc, and B12'},
    'fish':     {'calories':'~100 kcal/100g','protein':'20g','fat':'3g','carbs':'0g','benefits':'Omega-3 fatty acids, heart healthy'},
    'egg':      {'calories':'155 kcal/100g','protein':'13g','fat':'11g','carbs':'1.1g','benefits':'Complete protein, rich in choline & Vitamin D'},
    'milk':     {'calories':'42 kcal/100ml','protein':'3.4g','fat':'1g','carbs':'5g','benefits':'Calcium, Vitamin D, bone health'},
    'spinach':  {'calories':'23 kcal/100g','protein':'2.9g','fat':'0.4g','carbs':'3.6g','benefits':'Iron, Vitamin K, folate, antioxidants'},
    'tomato':   {'calories':'18 kcal/100g','protein':'0.9g','fat':'0.2g','carbs':'3.9g','benefits':'Lycopene, Vitamin C, heart health'},
    'onion':    {'calories':'40 kcal/100g','protein':'1.1g','fat':'0.1g','carbs':'9.3g','benefits':'Quercetin, anti-inflammatory, immune support'},
    'potato':   {'calories':'77 kcal/100g','protein':'2g','fat':'0.1g','carbs':'17g','benefits':'Potassium, Vitamin C, energy source'},
    'banana':   {'calories':'89 kcal/100g','protein':'1.1g','fat':'0.3g','carbs':'23g','benefits':'Potassium, Vitamin B6, instant energy'},
    'apple':    {'calories':'52 kcal/100g','protein':'0.3g','fat':'0.2g','carbs':'14g','benefits':'Fiber, Vitamin C, antioxidants'},
    'mango':    {'calories':'60 kcal/100g','protein':'0.8g','fat':'0.4g','carbs':'15g','benefits':'Vitamin A, C, folate, immunity boost'},
    'paneer':   {'calories':'265 kcal/100g','protein':'18g','fat':'20g','carbs':'3.4g','benefits':'Calcium, protein for vegetarians'},
    'carrot':   {'calories':'41 kcal/100g','protein':'0.9g','fat':'0.2g','carbs':'10g','benefits':'Beta-carotene, Vitamin A, eye health'},
}

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

def get_nutrition_info(product_name):
    """Look up nutritional info using set-based fuzzy key matching"""
    pn_lower = product_name.lower().strip()
    pn_tokens = tokenize(pn_lower)  # convert to set
    db_keys = set(NUTRITION_DB.keys())

    # Direct intersection check first
    matched_keys = pn_tokens & db_keys
    if matched_keys:
        key = next(iter(matched_keys))
        return key, NUTRITION_DB[key]

    # Fuzzy fallback
    best, best_score = None, 0
    for key in db_keys:
        score = fuzz.partial_ratio(pn_lower, key)
        if score > best_score:
            best_score, best = score, key
    if best and best_score > 60:
        return best, NUTRITION_DB[best]
    return None, None

def handle_greeting():
    return {
        'type': 'text',
        'message': '👋 Hello! Welcome to FreshCart. I can help you with:\n• Finding fresh products (vegetables, meat, fish, dairy)\n• Checking prices and product details\n• Tracking your orders with delivery information\n• Answering questions about your purchases\n\nWhat would you like to know?'
    }

def handle_help():
    return {
        'type': 'text',
        'message': '🤖 **FreshCart AI Assistant**\n\n' +
            '📦 **Product Search**\n' +
            '• Find products: "show chicken", "price of onion"\n' +
            '• Browse all: "products" → "next"\n' +
            '• View stores: "store"\n\n' +
            '⚖️ **Smart Analysis (Set Algorithm)** 🆕\n' +
            '• Compare: "compare chicken vs mutton"\n' +
            '• Price filter: "vegetables under 50"\n' +
            '• Best deals: "deals" or "offers"\n' +
            '• Nutrition: "chicken nutrition"\n' +
            '• Categories: "show categories"\n\n' +
            '🛒 **Cart & Orders**\n' +
            '• View cart: "my cart"\n' +
            '• Track: "status", "live track my order"\n' +
            '• Order history: "history"\n\n' +
            '👤 **Profile & Support** 🆕\n' +
            '• Addresses: "my address", "delivery location"\n' +
            '• Notifications: "any alerts?", "messages"\n' +
            '• Support: "report an issue", "track my ticket"\n' +
            '• Info: "refund policy", "tax info", "cancellation"\n\n' +
            '🚚 **Delivery Info**\n' +
            '• Delivery time: 30-45 minutes\n' +
            '• Free delivery above ₹199\n' +
            '• Working hours: 8AM - 10PM\n\n' +
            '💳 **Payments:** UPI, Cards, COD\n\n' +
            '🤝 **Join Us**\n' +
            '• Become a Seller: "sell"\n' +
            '• Become Delivery Agent: "become agent"\n\n' +
            '💬 Just ask me anything!'
    }
