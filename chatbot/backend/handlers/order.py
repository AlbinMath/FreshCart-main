"""
handlers/order.py
-----------------
Handlers for order-related queries: tracking and history.
"""

from config.database import orders_collection

def get_detailed_orders(user_id, limit=1):
    """Get user's recent orders with complete details"""
    try:
        print(f"🔍 Searching for orders with userId: {user_id}")
        
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
        
        # Format dates
        for order in orders:
            if order.get('createdAt'):
                order['createdAt'] = order['createdAt'].strftime('%d %b %Y, %I:%M %p')
        
        return orders
    except Exception as e:
        print(f"❌ Error fetching detailed orders: {e}")
        return []

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
