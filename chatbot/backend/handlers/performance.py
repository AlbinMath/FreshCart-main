import requests
import os
from dotenv import load_dotenv

load_dotenv()

SELLER_AI_URL = os.environ.get('SELLER_AI_URL', 'http://localhost:6002')
CUSTOMER_AI_URL = os.environ.get('CUSTOMER_AI_URL', 'http://localhost:6003')

def get_ai_performance_intelligence(user_id):
    """
    Fetch multidimensional SVM analysis for a seller.
    Restricted to seller users only.
    """
    if not user_id:
        return {"success": False, "message": "🔐 Please login to access AI Performance Intelligence."}

    if not is_seller(user_id):
        return {"type": "text", "message": "🚫 **Access Denied.** AI Performance Intelligence is a premium feature exclusive to **Sellers**. If you are a seller, please ensure you are logged in with your seller account."}

    try:
        # 1. Fetch SVM Store Performance
        # We assume the user_id might be a seller_id or we resolve it
        resp = requests.get(f"{SELLER_AI_URL}/evaluate/{user_id}", timeout=5)
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get('success'):
                metrics = data.get('metrics', {})
                tier = data.get('tier', 'Unknown')
                insights = data.get('insights', [])
                
                msg = f"🧠 **AI Performance Intelligence (SVM Analysis)**\n\n"
                msg += f"📊 **Current Tier:** {tier}\n"
                msg += f"📈 **Success Rate:** {metrics.get('fulfillment_rate', 0)*100:.1f}%\n"
                msg += f"📉 **Cancellation Rate:** {metrics.get('cancellation_rate', 0)*100:.1f}%\n"
                msg += f"📦 **Total Orders processed:** {metrics.get('total_orders', 0)}\n\n"
                
                if insights:
                    msg += "💡 **AI Insights:**\n"
                    for ins in insights[:3]:
                        msg += f"• **{ins['title']}**: {ins['description']}\n"
                
                return {"type": "text", "message": msg}
        
        # 2. Try Customer Feedback analysis as well
        feedback = get_feedback_analysis(user_id)
        if feedback:
            return feedback

        return {"type": "text", "message": "🔍 No specific store performance data found for your account. Start selling to see AI analysis!"}

    except Exception as e:
        print(f"Error in performance handler: {e}")
        return {"type": "text", "message": "📡 Error connecting to the AI Performance Engine."}

def is_seller(user_id):
    """Check if the user has a seller role"""
    from config.database import users_collection
    from bson import ObjectId
    try:
        # Check by ID or sellerUniqueId
        query = {"$or": [
            {"_id": ObjectId(user_id) if len(user_id) == 24 else user_id},
            {"sellerUniqueId": user_id}
        ]}
        user = users_collection.find_one(query, {"role": 1})
        return user and str(user.get('role', '')).lower() == 'seller'
    except:
        return False

def get_feedback_analysis(user_id):
    """
    Fetch sentiment analysis and common themes from customer feedback/reviews.
    """
    from config.database import reviews_collection, products_collection
    from bson import ObjectId

    try:
        # 1. Resolve Seller IDs (Simplified logic)
        # In this project, sellerUniqueId is often used
        products = list(products_collection.find(
            {"$or": [{"sellerId": user_id}, {"sellerUniqueId": user_id}]},
            {"_id": 1}
        ))
        
        if not products:
            return None
            
        product_ids = [str(p["_id"]) for p in products]
        
        # 2. Fetch Reviews
        reviews = list(reviews_collection.find(
            {"productId": {"$in": product_ids}},
            {"reviewText": 1, "overallRate": 1}
        ))
        
        if not reviews:
            return None
            
        # Convert ObjectId if any
        for r in reviews:
            if "_id" in r: r["_id"] = str(r["_id"])
            
        # 3. Call Customer AI Service for analysis
        resp = requests.post(f"{CUSTOMER_AI_URL}/analyze-reviews", json={"reviews": reviews}, timeout=5)
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get('success'):
                summary = data.get('summary')
                sentiment = data.get('sentiment')
                score = data.get('score', 0)
                
                msg = f"⭐ **Customer Feedback Intelligence**\n\n"
                msg += f"📊 **Overall Sentiment:** {sentiment}\n"
                msg += f"📝 **AI Summary:** {summary}\n"
                msg += f"📉 **Sentiment Score:** {score:.2f} (-1 to 1)\n"
                msg += f"💬 Analyzed **{len(reviews)}** customer reviews."
                
                return {"type": "text", "message": msg}
        
        return None
    except Exception as e:
        print(f"Error in feedback analysis: {e}")
        return None

def trigger_ai_training(user_id):
    """Trigger retraining of the SVM model"""
    if not user_id:
        return {"success": False, "message": "🔐 Please login to trigger AI training."}
    
    if not is_seller(user_id):
        return {"type": "text", "message": "🚫 **Unauthorized.** Only registered Sellers can initiate AI retraining for performance intelligence."}

    try:
        resp = requests.post(f"{SELLER_AI_URL}/train", timeout=30)
        if resp.status_code == 200:
            return {"type": "text", "message": "✅ **AI Training Initiated!** The Multidimensional SVM model is being updated with the latest store performance and feedback data."}
        return {"type": "text", "message": "❌ Failed to initiate AI training."}
    except Exception as e:
        return {"type": "text", "message": "📡 Error connecting to the training service."}
