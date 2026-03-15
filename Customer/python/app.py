from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Lazy loading to avoid MemoryError on startup
def get_recommendations_from_engine(user_id, limit):
    from KNN.recommender import ProductRecommender
    recommender = ProductRecommender()
    return recommender.recommend(user_id, n_recommendations=limit)

def analyze_review_text(reviews):
    from textblob import TextBlob
    from collections import Counter
    
    if not reviews:
        return "No reviews to analyze.", "Neutral", 0
        
    total_polarity = 0
    all_features = []
    
    for r in reviews:
        text = r.get('reviewText', '')
        if text:
            blob = TextBlob(text)
            total_polarity += blob.sentiment.polarity
        features = r.get('likeFeatures', [])
        if isinstance(features, list):
            all_features.extend(features)
            
    avg_polarity = total_polarity / len(reviews) if reviews else 0
    sentiment = "Positive" if avg_polarity > 0.1 else "Negative" if avg_polarity < -0.1 else "Neutral"
    
    summary = f"Overall sentiment is {sentiment.lower()}."
    if all_features:
        common = [f for f, c in Counter(all_features).most_common(2)]
        summary += f" Users liked: {', '.join(common)}."
        
    return summary, sentiment, avg_polarity

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "FreshCart AI"})

@app.route('/recommend', methods=['POST', 'OPTIONS'])
def recommend():
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200
    try:
        data = request.json or {}
        user_id = data.get('userId')
        limit = data.get('limit', 4)
        
        if not user_id:
            return jsonify({"success": False, "message": "UserId required"}), 400
            
        print(f"Request: Recommend for {user_id}")
        recs = get_recommendations_from_engine(user_id, limit)
        print(f"Response: Found {len(recs)} recommendations")
        return jsonify({"success": True, "recommendations": recs})
    except Exception as e:
        import traceback
        print(f"Error: {traceback.format_exc()}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/analyze-reviews', methods=['POST'])
def analyze():
    try:
        data = request.json or {}
        reviews = data.get('reviews', [])
        summary, sentiment, score = analyze_review_text(reviews)
        return jsonify({
            "success": True,
            "summary": summary,
            "sentiment": sentiment,
            "score": score
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PYTHON_PORT", 6003))
    print(f"Starting AI Service on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
