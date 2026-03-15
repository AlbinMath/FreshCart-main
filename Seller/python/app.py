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
        products_cursor = list(p_db.products.find({
            "$or": [
                {"sellerUniqueId": {"$in": unique_mongo_ids}}, 
                {"sellerId": {"$in": unique_mongo_ids}}
            ]
        }, {"_id": 1, "category": 1}))
        
        product_ids = [str(p["_id"]) for p in products_cursor]
        product_names = list(set([p.get('productName') for p in products_cursor if p.get('productName')]))
        product_category_map = {str(p["_id"]): p.get('category') for p in products_cursor}
        
        # Build map for name-based lookup too
        for p in products_cursor:
            if p.get('productName'):
                product_category_map[p.get('productName')] = p.get('category')

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
        # Updated query to include name-based matches as fallback for "ORDER_LEVEL" or mismatched IDs
        reviews_query = {
            "$or": [
                {"productId": {"$in": product_ids}},
                {"productName": {"$in": product_names}}
            ]
        }
        reviews = list(p_db.Reviews.find(reviews_query, {"overallRate": 1, "qualityRate": 1, "deliveryRate": 1, "reviewText": 1, "productId": 1, "productName": 1}))
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
            
        orders = list(p_db.Orders.find(orders_query, {"status": 1, "items": 1, "createdAt": 1, "updatedAt": 1}))
        
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

        # --- AI Insights Patterns Generation ---
        insights = []
        
        # A. Product Category Performance
        categories_scores = {}
        for r in reviews:
            pid = str(r.get('productId'))
            name = str(r.get('productName'))
            cat = product_category_map.get(pid) or product_category_map.get(name)
            if cat:
                if cat not in categories_scores: categories_scores[cat] = []
                categories_scores[cat].append(float(r.get('qualityRate') or 3))
        
        cat_stats = []
        for cat, ratings in categories_scores.items():
            cat_stats.append({"category": cat, "avg": sum(ratings) / len(ratings)})
        
        cat_stats.sort(key=lambda x: x['avg'], reverse=True)
        if len(cat_stats) >= 2:
            insights.append({
                "title": "Product Category Performance",
                "description": f"AI detected that your '{cat_stats[0]['category']}' category has higher quality ratings than '{cat_stats[1]['category']}'.",
                "impact": "high"
            })
        elif len(cat_stats) == 1:
            insights.append({
                "title": "Product Category Performance",
                "description": f"AI detected that your '{cat_stats[0]['category']}' category has exceptional quality ratings.",
                "impact": "high"
            })

        # B. Review Keywords Analysis
        keywords_to_check = ['fresh', 'timely', 'well-packed', 'clean', 'quality', 'quick']
        top_reviews = [r for r in reviews if float(r.get('overallRate') or 0) >= 4]
        keyword_matches = 0
        if top_reviews:
            for r in top_reviews:
                text = str(r.get('reviewText') or "").lower()
                if any(k in text for k in keywords_to_check):
                    keyword_matches += 1
            
            percentage = int((keyword_matches / len(top_reviews)) * 100)
            if percentage > 0:
                insights.append({
                    "title": "Review Keywords Analysis",
                    "description": f"Keywords like 'fresh', 'timely', and 'well-packed' appear in {percentage}% of your top-rated products.",
                    "impact": "medium"
                })

        # C. Delivery Correlation
        delivered_orders = [o for o in orders if is_status(o, 'Delivered')]
        in_2_hrs = 0
        from datetime import datetime
        for o in delivered_orders:
            try:
                c_at = o.get('createdAt')
                u_at = o.get('updatedAt')
                if isinstance(c_at, datetime) and isinstance(u_at, datetime):
                    if (u_at - c_at).total_seconds() / 3600 < 2:
                        in_2_hrs += 1
            except: pass
        
        if in_2_hrs > 0:
            insights.append({
                "title": "Delivery Correlation",
                "description": f"Significant correlation found between 'Delivered in < 2 hrs' and your {in_2_hrs} successful orders.",
                "impact": "high"
            })
        elif delivered > 0:
            insights.append({
                "title": "Delivery Stability",
                "description": f"Consistent delivery patterns found across your {delivered} successful orders.",
                "impact": "medium"
            })

        # Fallback if no insights generated
        if not insights:
            insights.append({
                "title": "Data Accumulation",
                "description": "Increase your sales and collect more reviews to unlock deep AI patterns and correlations.",
                "impact": "medium"
            })

        response_data = {
            "success": True,
            "seller_id": seller_id,
            "resolved_ids": list(all_ids),
            "model_updated_at": model_updated_at,
            "insights": insights,
           **result
        }
        
        # Save to cache
        performance_cache[seller_id] = (response_data, time.time())
        
        return jsonify(response_data)

    except Exception as e:
        print(f"Error in evaluate_seller: {traceback.format_exc()}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/product-analysis/<seller_id>', methods=['GET'])
def analyze_products(seller_id):
    try:
        p_db, u_db = get_dbs()
        if p_db is None:
            return jsonify({"success": False, "message": "Database connection failed"}), 500

        # Resolve IDs
        search_ids = [seller_id]
        if len(seller_id) == 24:
            try: search_ids.append(ObjectId(seller_id))
            except: pass
            
        user_data = u_db.Users.find_one({
            "$or": [{"_id": {"$in": search_ids}}, {"sellerUniqueId": {"$in": search_ids}}]
        }, {"_id": 1, "sellerUniqueId": 1})
        
        all_ids = [seller_id]
        if user_data:
            all_ids.append(str(user_data["_id"]))
            if "sellerUniqueId" in user_data: all_ids.append(str(user_data["sellerUniqueId"]))
        
        mongo_ids = []
        for uid in set(all_ids):
            mongo_ids.append(uid)
            if len(uid) == 24:
                try: mongo_ids.append(ObjectId(uid))
                except: pass

        # 1. Fetch products
        products = list(p_db.products.find({
            "$or": [{"sellerUniqueId": {"$in": mongo_ids}}, {"sellerId": {"$in": mongo_ids}}]
        }))
        
        if not products:
            return jsonify({"success": True, "recommendations": [], "insights": []})

        product_ids = [str(p["_id"]) for p in products]
        
        # 2. Fetch Orders to calculate sales velocity
        # We look for orders containing these products
        orders_query = {
            "items.productId": {"$in": [ObjectId(pid) if len(pid)==24 else pid for pid in product_ids]},
            "status": "Delivered"
        }
        orders = list(p_db.Orders.find(orders_query, {"items": 1, "createdAt": 1}))
        
        sales_map = {}
        revenue_map = {}
        for o in orders:
            for item in o.get('items', []):
                pid = str(item.get('productId'))
                if pid in product_ids:
                    qty = int(item.get('quantity', 1))
                    price = float(item.get('price', 0))
                    sales_map[pid] = sales_map.get(pid, 0) + qty
                    revenue_map[pid] = revenue_map.get(pid, 0) + (qty * price)

        # 3. Fetch Reviews for rating analysis
        reviews = list(p_db.Reviews.find({"productId": {"$in": product_ids}}, {"productId": 1, "overallRate": 1}))
        rating_map = {}
        for r in reviews:
            pid = str(r.get('productId'))
            rating_map.setdefault(pid, []).append(float(r.get('overallRate') or 3))

        # 4. Process individual product analytics
        analysis_results = []
        for p in products:
            pid = str(p["_id"])
            sales = sales_map.get(pid, 0)
            revenue = revenue_map.get(pid, 0)
            ratings = rating_map.get(pid, [])
            avg_rating = sum(ratings) / len(ratings) if ratings else 0
            
            stock = int(p.get('stockQuantity', 0))
            threshold = int(p.get('lowStockThreshold', 10))
            
            # Recommendation Score Algorithm
            # Weight: Sales (60%) + Rating (30%) + Revenue (10%)
            # This identifies "Best Sellers" that customers actually like
            score = (sales * 0.6) + (avg_rating * 2.0) + (revenue * 0.001)
            
            # Stock Suggestion Logic (Demand Forecasting Lite)
            suggestion = "Maintain Level"
            action_color = "green"
            
            if stock <= threshold:
                if sales > 10:
                    suggestion = "CRITICAL: Restock High Demand Item"
                    action_color = "red"
                else:
                    suggestion = "Restock Soon"
                    action_color = "yellow"
            elif sales > 20 and stock < (sales * 0.5): # Sold more than half of current stock recently
                suggestion = "High Velocity: Increase Stock"
                action_color = "blue"

            analysis_results.append({
                "productId": pid,
                "productName": p.get('productName'),
                "category": p.get('category'),
                "sales": sales,
                "revenue": revenue,
                "avgRating": avg_rating,
                "reviewCount": len(ratings),
                "stock": stock,
                "score": score,
                "suggestion": suggestion,
                "color": action_color,
                "image": p.get('image') or (p.get('images')[0] if p.get('images') else None)
            })

        # Sort by score for recommendations
        analysis_results.sort(key=lambda x: x['score'], reverse=True)
        
        # Identify top recommended products
        top_recs = analysis_results[:3]
        
        # Generate actionable insights
        insights = []
        if top_recs:
             insights.append({
                 "type": "success",
                 "message": f"Your top performing product is '{top_recs[0]['productName']}'. Consider running a promotion to boost it further."
             })
        
        needs_stock = [a for a in analysis_results if a['color'] in ['red', 'yellow']]
        if needs_stock:
            insights.append({
                "type": "warning",
                "message": f"Inventory Alert: {len(needs_stock)} products are below threshold. '{needs_stock[0]['productName']}' needs immediate attention."
            })

        return jsonify({
            "success": True,
            "seller_id": seller_id,
            "total_products_analyzed": len(products),
            "recommendations": top_recs,
            "all_analysis": analysis_results,
            "insights": insights
        })

    except Exception as e:
        print(f"Error in analyze_products: {traceback.format_exc()}")
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
