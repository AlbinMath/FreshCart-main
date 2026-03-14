from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId
from SVM.seller_evaluator import SellerEvaluator
from SVM.train_model import train_svm
import traceback

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Evaluator
evaluator = SellerEvaluator()

# Simple in-memory cache
performance_cache = {}
CACHE_TIMEOUT = 300 # 5 minutes

def get_dbs():
    try:
        p_uri = os.getenv("MONGODB_URI_Products")
        u_uri = os.getenv("MONGODB_URI_Users")
        p_client = MongoClient(p_uri, serverSelectionTimeoutMS=2000)
        u_client = MongoClient(u_uri, serverSelectionTimeoutMS=2000)
        return p_client.get_database(), u_client.get_database()
    except Exception as e:
        print(f"DB Connection Error: {e}")
        return None, None

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy", 
        "service": "Seller Performance Evaluation (SVM)",
        "features": ["Reviews", "Orders", "Registrations", "Cancellations"]
    })

@app.route('/evaluate/<seller_id>', methods=['GET'], strict_slashes=False)
def evaluate_seller(seller_id):
    try:
        # Debugging: Log the request
        print(f"Evaluation requested for seller: {seller_id}")
        # Check cache for faster loading
        import time
        if seller_id in performance_cache:
            cached_data, timestamp = performance_cache[seller_id]
            if time.time() - timestamp < CACHE_TIMEOUT:
                return jsonify(cached_data)

        p_db, u_db = get_dbs()
        if p_db is None or u_db is None:
            return jsonify({"success": False, "message": "Database connection failed"}), 500

        # --- 0. Resolve ALL IDs associated with this seller ---
        # First, find the user in Users database to get both _id and sellerUniqueId
        search_ids_pre = [seller_id]
        if len(seller_id) == 24:
            try: search_ids_pre.append(ObjectId(seller_id))
            except: pass
            
        user_data = u_db.Users.find_one({
            "$or": [
                {"_id": {"$in": search_ids_pre}},
                {"sellerUniqueId": {"$in": search_ids_pre}}
            ]
        }, {"_id": 1, "sellerUniqueId": 1, "createdAt": 1})
        
        # Build set of all associated IDs
        all_ids = {seller_id}
        account_age = 30
        if user_data:
            all_ids.add(str(user_data["_id"]))
            if "sellerUniqueId" in user_data: all_ids.add(str(user_data["sellerUniqueId"]))
            
            # Use real account age if available
            if 'createdAt' in user_data:
                from datetime import datetime
                created_at = user_data['createdAt']
                if isinstance(created_at, datetime):
                    account_age = (datetime.now() - created_at).days
        
        # Comprehensive ID list for MongoDB queries (both string and ObjectId)
        unique_mongo_ids = []
        for uid in all_ids:
            unique_mongo_ids.append(uid)
            if isinstance(uid, str) and len(uid) == 24:
                try: unique_mongo_ids.append(ObjectId(uid))
                except: pass
        
        unique_mongo_ids = list(set(unique_mongo_ids))
        
        # --- 1. Find Products & Aggregate identifiers ---
        products_cursor = p_db.products.find({
            "$or": [
                {"sellerUniqueId": {"$in": unique_mongo_ids}}, 
                {"sellerId": {"$in": unique_mongo_ids}}
            ]
        }, {"_id": 1})
        
        product_ids = [str(p["_id"]) for p in products_cursor]

        if not product_ids:
             return jsonify({
                 "success": True, 
                 "tier": "New Seller", 
                 "message": "No products found for this seller",
                 "metrics": {
                     "quality": 3.0, "delivery": 3.0, "fulfillment_rate": 0.5, 
                     "overall": 3.0, "review_count": 0, "success_count": 0, "failure_count": 0,
                     "cancellation_rate": 0.0
                 },
                 "confidence": 0.1
             })

        # --- 2. Metrics: Reviews ---
        reviews = list(p_db.Reviews.find({"productId": {"$in": product_ids}}, {"overallRate": 1, "qualityRate": 1, "deliveryRate": 1}))
        count = len(reviews)
        
        if count > 0:
            avg_overall = sum(float(r.get('overallRate') or 3) for r in reviews) / count
            avg_quality = sum(float(r.get('qualityRate') or 3) for r in reviews) / count
            avg_delivery = sum(float(r.get('deliveryRate') or 3) for r in reviews) / count
        else:
            avg_overall, avg_quality, avg_delivery = 3.0, 3.0, 3.0

        # --- 3. Metrics: Orders (Successes & Failures) ---
        # Search using all possible ID variants AND matched product IDs
        # This is more robust as it covers orders where seller IDs might be inconsistently stored
        orders_query = {
            "$or": [
                {"sellerId": {"$in": unique_mongo_ids}},
                {"items.sellerId": {"$in": unique_mongo_ids}},
                {"sellerUniqueId": {"$in": unique_mongo_ids}}
            ]
        }
        # Add product_ids as a fallback search criteria (supporting both formats)
        if product_ids:
            search_product_ids = []
            for pid in product_ids:
                search_product_ids.append(pid)
                if isinstance(pid, str) and len(pid) == 24:
                    try: search_product_ids.append(ObjectId(pid))
                    except: pass
            orders_query["$or"].append({"items.productId": {"$in": search_product_ids}})
            
        orders = list(p_db.Orders.find(orders_query, {"status": 1, "items": 1}))
        
        order_volume = len(orders)
        
        # Case-insensitive status matching for better reliability
        def is_status(order, target_status):
            status = str(order.get('status', '')).strip().lower()
            return status == target_status.lower()

        delivered = sum(1 for o in orders if is_status(o, 'Delivered'))
        cancelled = sum(1 for o in orders if is_status(o, 'Cancelled'))
        
        # Include 'Shipped' and 'Processing' as "active/success" signals for real-time feel
        # but keep successes/failures to final states for SVM training logic
        try:
            active_orders = sum(1 for o in orders if is_status(o, 'Shipped') or is_status(o, 'Processing'))
        except:
            active_orders = 0

        fulfillment_rate = (delivered / order_volume) if order_volume > 0 else 0.5
        cancellation_rate = (cancelled / order_volume) if order_volume > 0 else 0.0

        # --- 5. Predict using SVM ---
        result = evaluator.predict_performance(
            avg_overall, avg_quality, avg_delivery, count, 
            order_volume, fulfillment_rate, account_age
        )
        
        # Ensure metrics dictionary exists (might be missing if model loading failed)
        if "metrics" not in result:
             result["metrics"] = {}

        # Inject cancellation data for "Failures" tracking
        result["metrics"]["cancellation_rate"] = cancellation_rate
        result["metrics"]["success_count"] = delivered
        result["metrics"]["failure_count"] = cancelled
        result["metrics"]["active_orders"] = active_orders
        result["metrics"]["total_orders"] = order_volume

        # Get model last updated time
        model_updated_at = "Unknown"
        if os.path.exists(evaluator.model_path):
            import datetime as dt
            mtime = os.path.getmtime(evaluator.model_path)
            model_updated_at = dt.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M')

        response_data = {
            "success": True,
            "seller_id": seller_id,
            "resolved_ids": list(all_ids),
            "model_updated_at": model_updated_at,
           **result
        }
        
        # Save to cache
        performance_cache[seller_id] = (response_data, time.time())
        
        return jsonify(response_data)

    except Exception as e:
        print(f"Error in evaluate_seller: {traceback.format_exc()}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/train', methods=['POST', 'GET']) # Allow GET as fallback for manual triggers
def trigger_training():
    try:
        print("Starting manual training trigger...")
        train_svm()
        evaluator.load_model() # Reload model after training
        return jsonify({"success": True, "message": "SVM Model retrained successfully"})
    except Exception as e:
        print(f"Training failed: {traceback.format_exc()}")
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    # Use port 6002 as requested
    port = int(os.environ.get("PYTHON_PORT_SELLER", 6002))
    print(f"Seller Performance SVM Service running on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
