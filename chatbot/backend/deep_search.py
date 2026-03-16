from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

def deep_search():
    uri = os.getenv('MONGODB_URI_Users')
    client = MongoClient(uri)
    
    for db_name in client.list_database_names():
        if db_name in ['admin', 'local', 'config']: continue
        db = client[db_name]
        print(f"\nDB: {db_name}")
        for coll_name in db.list_collection_names():
            count = db[coll_name].count_documents({})
            if count > 0:
                # Peek at the first doc
                doc = db[coll_name].find_one()
                keys = list(doc.keys())
                
                is_user_coll = any(k in keys for k in ['email', 'uid', 'role', 'username', 'password'])
                
                if is_user_coll:
                    print(f"  [USER?] {coll_name} ({count} docs)")
                    print(f"    Sample: email={doc.get('email')} | name={doc.get('name', doc.get('fullName'))} | role={doc.get('role')}")
                elif count < 10:
                     print(f"  {coll_name} ({count} docs) - Keys: {keys[:5]}")

if __name__ == "__main__":
    deep_search()
