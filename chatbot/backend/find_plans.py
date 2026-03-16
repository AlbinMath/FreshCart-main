from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

def find_premium_plans():
    uri = os.getenv('MONGODB_URI_Users')
    client = MongoClient(uri)
    for db_name in client.list_database_names():
        db = client[db_name]
        for coll in db.list_collection_names():
            if 'premium' in coll.lower() or 'plan' in coll.lower():
                count = db[coll].count_documents({})
                print(f"Found collection: {db_name}.{coll} ({count} docs)")

if __name__ == "__main__":
    find_premium_plans()
