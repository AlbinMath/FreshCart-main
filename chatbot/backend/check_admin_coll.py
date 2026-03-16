from config.database import _users_db
import json
from bson import json_util

def check_admin_coll():
    coll = _users_db['Admin']
    count = coll.count_documents({})
    print(f"Found {count} docs in Admin collection")
    if count > 0:
        for doc in coll.find().limit(5):
            print(json.dumps(doc, indent=2, default=json_util.default))

if __name__ == "__main__":
    check_admin_coll()
