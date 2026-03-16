from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

def check_all_dbs():
    uri = os.getenv('MONGODB_URI_Users')
    # Remove the database part from URI to list all dbs
    base_uri = uri.split('?')[0]
    if '/' in base_uri.replace('://', ''):
        base_uri = base_uri.rsplit('/', 1)[0]
    
    client = MongoClient(uri)
    print("Databases:", client.list_database_names())
    
    for db_name in client.list_database_names():
        if db_name in ['admin', 'local', 'config']: continue
        db = client[db_name]
        print(f"\n--- {db_name} Collections ---")
        print(db.list_collection_names())
        
        # Check for 'users' or 'Users' in any DB
        for coll in db.list_collection_names():
            if coll.lower() == 'users':
                count = db[coll].count_documents({})
                print(f"  - {coll}: {count} documents")
                if count > 0:
                    sample = db[coll].find_one()
                    print(f"    Sample ID: {sample.get('_id')} | Name: {sample.get('name', sample.get('fullName'))}")

if __name__ == "__main__":
    check_all_dbs()
