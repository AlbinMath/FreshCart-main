"""
handlers/cart.py
----------------
Handlers for cart-related queries.
"""

from config.database import cart_collection

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
