from config.database import premium_plans_collection, customer_collection
import json
from bson import json_util

def test_final():
    print(f"Collection count: {premium_plans_collection.count_documents({})}")
    plans = list(premium_plans_collection.find({"type": "customer", "isVisible": True}))
    print(f"Customer plans found: {len(plans)}")
    for p in plans:
        print(f"- {p.get('name')} ({p.get('price')})")
        
    print("\nCheck customer collection:")
    cust = customer_collection.find_one()
    if cust:
        print(f"Sample Customer: {cust.get('name')} | UID: {cust.get('uid')}")
    else:
        print("Customer collection still empty?")

if __name__ == "__main__":
    test_final()
