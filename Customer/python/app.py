from flask import Flask, request, jsonify
from flask_cors import CORS
from textblob import TextBlob
import os
from dotenv import load_dotenv
import nltk

try:
    # Attempt to download necessary NLTK corpora for TextBlob
    nltk.data.find('corpora/movie_reviews')
    nltk.data.find('corpora/senticnet')
except LookupError:
    print("Downloading NLTK corpora...")
    nltk.download('movie_reviews')
    nltk.download('senticnet')
    nltk.download('punkt')
    nltk.download('brown')
    nltk.download('wordnet')
    nltk.download('omw-1.4')

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "message": "Service is up"})

@app.route('/analyze-reviews', methods=['POST'])
def analyze_reviews():
    try:
        data = request.json
        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400
            
        reviews = data.get('reviews', [])
        print(f"Analyzing {len(reviews)} reviews with full context...")
        
        if not reviews:
            return jsonify({
                "success": True,
                "summary": "No customer feedback available yet.",
                "sentiment": "Neutral",
                "score": 0
            })

        total_polarity = 0
        text_blocks = []
        suggestions = []
        delivery_feedbacks = []
        all_features = []
        
        for review in reviews:
            # Main Review Text
            rt = review.get('reviewText', '')
            if rt:
                text_blocks.append(rt)
                total_polarity += TextBlob(rt).sentiment.polarity
            
            # Suggestions
            sug = review.get('suggestion', '')
            if sug and sug.strip() and sug.lower() != 'none':
                suggestions.append(sug)
            
            # Delivery Review
            dr = review.get('deliveryReview', '')
            if dr:
                delivery_feedbacks.append(dr)
                total_polarity += TextBlob(dr).sentiment.polarity * 0.5 # Delivery is secondary weight
            
            # Like Features
            features = review.get('likeFeatures', [])
            if isinstance(features, list):
                all_features.extend(features)
            
        if not text_blocks and not delivery_feedbacks:
            return jsonify({
                "success": True,
                "summary": "Reviews contain no text to analyze.",
                "sentiment": "Neutral",
                "score": 0
            })

        avg_polarity = total_polarity / (len(text_blocks) + (len(delivery_feedbacks) * 0.5) if (len(text_blocks) + len(delivery_feedbacks)) > 0 else 1)
        
        sentiment = "Neutral"
        if avg_polarity > 0.15:
            sentiment = "Highly Positive" if avg_polarity > 0.5 else "Positive"
        elif avg_polarity < -0.15:
            sentiment = "Negative"
            
        # Build comprehensive summary
        summary_parts = []
        summary_parts.append(f"Based on {len(reviews)} customer reviews, the overall sentiment is {sentiment.lower()}.")
        
        # Add feature highlights
        if all_features:
            from collections import Counter
            feat_counts = Counter(all_features)
            top_feats = [f for f, c in feat_counts.most_common(3)]
            summary_parts.append(f"Customers frequently praised: {', '.join(top_feats)}.")
            
        # Add delivery insight
        if delivery_feedbacks:
            del_polarity = sum(TextBlob(t).sentiment.polarity for t in delivery_feedbacks) / len(delivery_feedbacks)
            if del_polarity > 0.3:
                summary_parts.append("The delivery service is rated as excellent.")
            elif del_polarity < 0:
                summary_parts.append("There are some concerns regarding delivery speed or handling.")

        # Add suggestion insight (AI Summary of suggestions)
        if suggestions:
            summary_parts.append(f"Key areas for improvement identified: {suggestions[0] if len(suggestions) == 1 else 'multiple users suggested improvements.'}")

        return jsonify({
            "success": True,
            "sentiment": sentiment,
            "score": avg_polarity,
            "summary": " ".join(summary_parts),
            "details": {
                "sentiment": sentiment,
                "top_features": all_features[:5] if all_features else [],
                "delivery_score": "Excellent" if (delivery_feedbacks and del_polarity > 0.3) else "Good" if delivery_feedbacks else "N/A",
                "improvement_suggestions": suggestions[:3]
            }
        })
        
    except Exception as e:
        import traceback
        print(f"Error: {traceback.format_exc()}")
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PYTHON_PORT", 6000))
    app.run(host='0.0.0.0', port=port)
