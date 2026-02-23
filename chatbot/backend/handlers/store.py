"""
handlers/store.py
-----------------
Handlers for store and seller related queries.
"""

from config.database import (
    stores_collection, sellers_collection, products_collection, PRODUCT_QUERY
)

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
        
        # If no stores, try getting sellers from sellers
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
            {'$match': PRODUCT_QUERY},
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
        return None
