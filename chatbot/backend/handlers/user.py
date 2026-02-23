"""
handlers/user.py
----------------
Handlers for user-related profile information like addresses.
"""

from config.database import address_collection

def get_user_addresses(user_id):
    """Get all saved addresses for the user"""
    try:
        print(f"🏠 Fetching addresses for user UID: {user_id}")
        # In Address.js, the field is 'uid'
        addresses = list(address_collection.find({'uid': user_id}))
        return addresses
    except Exception as e:
        print(f"❌ Error fetching addresses: {e}")
        return []

def format_address(addr):
    """Format a single address document into a readable string"""
    parts = [
        addr.get('name', ''),
        addr.get('houseNumber', ''),
        addr.get('street', ''),
        addr.get('city', ''),
        addr.get('state', ''),
        addr.get('zipCode', '')
    ]
    # Filter out empty strings and join
    return ', '.join([p for p in parts if p])
