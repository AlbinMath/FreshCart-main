"""
handlers/delivery.py
--------------------
Handlers for delivery-related queries.
"""

from config.database import delivery_agents_collection, delivery_location_logs_collection, orders_collection
import datetime

def get_live_tracking_info(user_id):
    """Find the latest order for a user and get the assigned agent's current location"""
    try:
        # 1. Find the latest 'Out for Delivery' order for this user
        order = orders_collection.find_one(
            {'userId': user_id, 'status': 'Out for Delivery'},
            sort=[('createdAt', -1)]
        )
        
        if not order:
            # Fallback: check any active order
            order = orders_collection.find_one(
                {'userId': user_id, 'status': {'$in': ['Placed', 'Processing', 'Shipped']}},
                sort=[('createdAt', -1)]
            )
            if order:
                return {
                    'status': order['status'],
                    'message': f"📦 Order #{str(order['_id'])[-6:]} is currently **{order['status']}**.\nUpdating you once it's out for delivery!"
                }
            return None

        agent_id_str = order.get('deliveryAgentId')
        if not agent_id_str:
            return {
                'status': order['status'],
                'message': f"📦 Order #{str(order['_id'])[-6:]} is being prepared. No agent assigned yet."
            }

        # 2. Get Agent Info
        # Agent IDs in the DB might be ObjectIds or Strings
        from bson.objectid import ObjectId
        try:
            agent_id = ObjectId(agent_id_str)
        except:
            agent_id = agent_id_str

        agent = delivery_agents_collection.find_one({'_id': agent_id})
        
        # 3. Get Latest Location Log
        log = delivery_location_logs_collection.find_one(
            {'agentId': agent_id},
            sort=[('timestamp', -1)]
        )

        agent_name = agent.get('fullName', 'Our Delivery Partner')
        
        if log:
            lat = log['location']['lat']
            lng = log['location']['lng']
            # We can also use Google Maps link or just lat/lng
            map_url = f"https://www.google.com/maps?q={lat},{lng}"
            return {
                'status': 'Tracking',
                'agentName': agent_name,
                'location': log['location'],
                'mapUrl': map_url,
                'message': f"🚚 **Live Tracking: Order #{str(order['_id'])[-6:]}**\n\n" +
                    f"Agent **{agent_name}** is on the way!\n" +
                    f"📍 Current Position: {lat}, {lng}\n\n" +
                    f"🔗 [View on Google Maps]({map_url})"
            }
        
        return {
            'status': 'Out for Delivery',
            'agentName': agent_name,
            'message': f"🚚 Agent **{agent_name}** is delivering your order #{str(order['_id'])[-6:]}.\nWait while we fetch the precise location..."
        }

    except Exception as e:
        print(f"❌ Error in live tracking: {e}")
        return None

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
