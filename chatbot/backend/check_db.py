from config.database import _users_db
import json
from bson import json_util

def check_db():
    print("--- Users Database Collections ---")
    print(_users_db.list_collection_names())
    
    print("\n--- Sample user (lowercase) ---")
    user = _users_db['users'].find_one()
    print(json.dumps(user, indent=2, default=json_util.default))
    
    print("\n--- Sample Users (uppercase) ---")
    user_up = _users_db['Users'].find_one()
    print(json.dumps(user_up, indent=2, default=json_util.default))
    
    # Let's check if there's any other collection that might have plans
    # Maybe 'PremiumPlans' is in another database?
    # Actually, let's check the Public API code if possible.
    # The summary said PremiumPlans.jsx uses http://localhost:5001/api/public/premium-plans
    # Let's find where that route is defined.
    
if __name__ == "__main__":
    check_db()
