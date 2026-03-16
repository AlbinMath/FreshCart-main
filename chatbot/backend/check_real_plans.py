from pymongo import MongoClient
import os
from dotenv import load_dotenv
import json
from bson import json_util

load_dotenv()

def check_real_plans():
    uri = os.getenv('MONGODB_URI_Users')
    client = MongoClient(uri)
    db = client['AdministratorData']
    coll = db['premiumplans']
    doc = coll.find_one()
    print(json.dumps(doc, indent=2, default=json_util.default))

if __name__ == "__main__":
    check_real_plans()
