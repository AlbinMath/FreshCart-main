"""
config/database.py
------------------
Centralised MongoDB connection pool for the FreshCart Chatbot.
All collections are exported from here; every other module imports
from this file — no raw MongoClient calls anywhere else.
"""

from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

# --------------------------------------------------------------------------- #
#  Connections
# --------------------------------------------------------------------------- #
try:
    # Products DB  (products, Orders, Reviews)
    _products_client   = MongoClient(os.getenv('MONGODB_URI_Products'))
    _products_db       = _products_client['Products']
    products_collection       = _products_db['products']
    orders_collection         = _products_db['Orders']
    reviews_collection        = _products_db['Reviews']

    # ChatBot DB  (FAQs)
    _chatbot_client    = MongoClient(os.getenv('MONGODB_URI_ChatBot'))
    _chatbot_db        = _chatbot_client['ChatBot']
    faqs_collection           = _chatbot_db['faqs']

    # Users DB  (Customer login info)
    _users_client      = MongoClient(os.getenv('MONGODB_URI_Users'))
    _users_db          = _users_client['Users']
    customer_collection       = _users_db['Customer']

    # Customer DB  (Cart, Addresses)
    _customer_client   = MongoClient(os.getenv('MONGODB_URI_Customer'))
    _customer_db       = _customer_client['Customer']
    cart_collection           = _customer_db['Cart']
    address_collection        = _customer_db['address']

    # Seller DB  (Sellers, Stores)
    _seller_client     = MongoClient(os.getenv('MONGODB_URI_Seller'))
    _seller_db         = _seller_client['Seller']
    sellers_collection        = _seller_db['sellers']
    stores_collection         = _seller_db['stores']

    # Announcements DB (Reports)
    _announcements_client = MongoClient(os.getenv('MONGODB_URI_Announcements'))
    _announcements_db     = _announcements_client['Announcements']
    reports_collection           = _announcements_db['reports']

    # Delivery / Users DB (Delivery Agents, Location Logs)
    delivery_agents_collection = _users_db['Deliveryagent']
    delivery_location_logs_collection = _users_db['deliverylocationlogs']

    # Notifications (stored in Products DB as per Seller Backend Notification.js)
    notifications_collection   = _products_db['notifications']

    print("✅ [DB] Connected to all databases successfully!")
    print("   📦 Products DB : products, Orders, Reviews, notifications")
    print("   🤖 ChatBot DB  : faqs")
    print("   👥 Users DB    : Customer, Deliveryagent, deliverylocationlogs")
    print("   🛒 Customer DB : Cart, address")
    print("   📢 Announcements DB : reports")
    print("   🏪 Seller DB   : sellers, stores")

except Exception as e:
    print(f"❌ [DB] Connection error: {e}")
    raise

# --------------------------------------------------------------------------- #
#  Shared product query  — includes products with None/missing approvalStatus
# --------------------------------------------------------------------------- #
PRODUCT_QUERY = {
    'approvalStatus': {'$in': ['Approved', None, 'approved', 'active', 'Active']}
}
