"""
handlers/navigation.py
----------------------
Handlers for navigation-related commands.
"""

from flask import jsonify

def handle_nav_cart():
    return jsonify({
        'type': 'navigation',
        'action': 'cart',
        'message': '🛒 **Opening Your Cart...**\n\n' +
            '👉 Click the **Cart icon** in the top right corner\n' +
            'Or go to: **/cart**\n\n' +
            '💡 You can also type **"my cart"** to see cart items here!'
    })

def handle_nav_orders():
    return jsonify({
        'type': 'navigation',
        'action': 'orders',
        'message': '📦 **Your Orders**\n\n' +
            '👉 Click **Profile > My Orders** in the menu\n' +
            'Or go to: **/orders**\n\n' +
            '📋 Type **"history"** to see order history here!\n' +
            '🚚 Type **"track my order"** to track your latest delivery!'
    })

def handle_nav_logout():
    return jsonify({
        'type': 'navigation',
        'action': 'logout',
        'message': '👋 **Logging Out...**\n\n' +
            '👉 Click **Profile icon** in the top right\n' +
            '👉 Select **"Logout"** from the dropdown\n\n' +
            '⚠️ Note: Your cart items will be saved for next time!\n\n' +
            'Thank you for shopping with FreshCart! 🙏'
    })

def handle_nav_login(user_id=None):
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

def handle_nav_home():
    return jsonify({
        'type': 'navigation',
        'action': 'home',
        'message': '🏠 **Going to Home Page...**\n\n' +
            '👉 Click the **FreshCart logo** in the header\n' +
            'Or go to: **/**\n\n' +
            '🛍️ Browse fresh products and deals on the home page!'
    })
