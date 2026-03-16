from config.database import (
    users_collection, customer_collection, sellers_collection, 
    delivery_agents_collection, customer_plans_collection, seller_info_collection,
    premium_plans_collection, admin_users_collection
)
from bson import ObjectId

def get_user_profile_summary(user_id):
    """Fetch a summary of the user's profile across role-specific collections."""
    if not user_id:
        return {"type": "text", "message": "🔐 Please login to view your profile details."}

    try:
        # 1. Search across all potential user collections since there is no central 'Users' table
        user = None
        collections_to_search = [
            customer_collection, 
            sellers_collection, 
            delivery_agents_collection, 
            admin_users_collection,
            users_collection # Keep as fallback
        ]
        
        query = {"$or": [
            {"_id": ObjectId(user_id) if len(user_id) == 24 else user_id},
            {"uid": user_id},
            {"userId": user_id},
            {"sellerUniqueId": user_id}
        ]}

        for coll in collections_to_search:
            user = coll.find_one(query)
            if user: break
        
        if not user:
            return {"type": "text", "message": f"🔍 Could not find your profile (ID: {user_id}) in our system. Are you logged in?"}

        role = user.get('role', 'User').capitalize()
        name = user.get('name', user.get('fullName', 'Valued Member'))
        email = user.get('email', 'Not provided')
        
        msg = f"👤 **Profile Info: {name}**\n\n"
        msg += f"📧 **Email:** {email}\n"
        msg += f"🛡️ **Role:** {role}\n"
        
        # 2. Get Role Specific Data (using the already found 'user' object)
        if role.lower() == 'customer':
            msg += f"📱 **Phone:** {user.get('phone', user.get('phoneNumber', 'N/A'))}\n"
            # Stored Addresses removed as per user request
        
        elif role.lower() in ['seller', 'vendor']:
            msg += f"🏪 **Store:** {user.get('storeName', 'FreshCart Store')}\n"
            msg += f"✅ **Status:** {user.get('status', 'Active')}\n"
            msg += f"📈 **Joined:** {user.get('createdAt').strftime('%Y-%m-%d') if hasattr(user.get('createdAt'), 'strftime') else 'N/A'}\n"
        
        elif role.lower() == 'deliveryagent':
            msg += f"🚚 **Vehicle:** {user.get('vehicleType', 'N/A')}\n"
            msg += f"📍 **Working Area:** {user.get('area', 'N/A')}\n"
        
        return {"type": "text", "message": msg}

    except Exception as e:
        print(f"Error in profile handler: {e}")
        return {"type": "text", "message": "📡 Error retrieving profile information."}

def get_customer_plans_info(user_id):
    """Fetch information about available customer plans from the template collection."""
    try:
        # Get all visible customer plans from the template database
        plans = list(premium_plans_collection.find({"type": "customer", "isVisible": True}))
        
        if not plans:
            # Fallback static plans if DB is empty
            msg = "💎 **FreshCart Premium Plans**\n\n"
            msg += "• **Basic Plan:** ₹99/mo - 5% extra discount, Standard delivery.\n"
            msg += "• **Gold Plan:** ₹249/mo - 10% extra discount, Free Express delivery.\n"
            msg += "• **Elite Plan:** ₹499/mo - 15% extra discount, Priority support, No delivery fee.\n\n"
            msg += "👉 Visit **Profile > Subscriptions** to join!"
            return {"type": "text", "message": msg}

        msg = "💎 **FreshCart Premium Membership Plans**\n\n"
        # Sort by price if possible (extract number)
        def get_price_val(p):
            try:
                import re
                nums = re.findall(r'\d+', str(p.get('price', '0')))
                return int(nums[0]) if nums else 0
            except: return 0
            
        plans.sort(key=get_price_val)

        for p in plans:
            msg += f"• **{p['name']}**: {p['price']}/{p.get('duration', 'mo')}\n"
            msg += f"  🎁 {p.get('description', 'High-speed delivery and exclusive deals!')}\n\n"
            
        return {"type": "text", "message": msg + "Visit the **[Premium Plans](http://localhost:5174/premium-plans)** page to upgrade and save more!"}
    except Exception as e:
        print(f"Error in plans handler: {e}")
        import traceback
        traceback.print_exc()
        return {"type": "text", "message": "📡 Error retrieving membership plans from server."}

def get_general_entity_info(entity_type):
    """Provide general info about platform entities like Sellers or Agents."""
    if entity_type == 'seller':
        count = sellers_collection.count_documents({"status": "Active"})
        return {
            "type": "text", 
            "message": f"🏪 **Our Sellers**\nWe have over **{count}** active sellers providing high-quality fresh produce! All our vendors are verified for quality and hygiene standards."
        }
    elif entity_type == 'agent':
        count = delivery_agents_collection.count_documents({"status": "Active"})
        return {
            "type": "text", 
            "message": f"🚚 **Delivery Intelligence**\nOur fleet of **{count}** active delivery agents uses AI-powered route clustering to ensure your food arrives within 45 minutes!"
        }
    return {"type": "text", "message": "🔍 I can tell you about our Sellers or Delivery Agents. What would you like to know?"}
