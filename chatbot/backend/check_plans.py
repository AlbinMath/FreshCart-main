from config.database import customer_plans_collection
import json
from bson import json_util

def check_plans():
    plans = list(customer_plans_collection.find({}))
    print(f"Found {len(plans)} plans/subscriptions")
    for p in plans:
        print(json.dumps(p, indent=2, default=json_util.default))

if __name__ == "__main__":
    check_plans()
