from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

def check_admin_db():
    uri = os.getenv('MONGODB_URI_admin')
    client = MongoClient(uri)
    db = client.get_database() # This should be 'admin'
    print(f"Collections in {db.name}:")
    print(db.list_collection_names())
    
    # Let's try to find 'premiumplans' or 'PremiumPlan'
    for coll in db.list_collection_names():
        if 'plan' in coll.lower():
            count = db[coll].count_documents({})
            print(f"  - {coll}: {count} docs")
            if count > 0:
                print(f"    Sample: {db[coll].find_one()}")

if __name__ == "__main__":
    check_admin_db()
