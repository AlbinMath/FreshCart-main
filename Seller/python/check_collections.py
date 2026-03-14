import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

def check_db(name, uri):
    print(f"\nChecking DB: {name}")
    try:
        client = MongoClient(uri)
        db = client.get_database()
        print(f"Collections in {db.name}: {db.list_collection_names()}")
    except Exception as e:
        print(f"Error checking {name}: {e}")

check_db("Products", os.getenv("MONGODB_URI_Products"))
check_db("Users", os.getenv("MONGODB_URI_Users"))
check_db("Seller", os.getenv("MONGODB_URI_Seller"))
