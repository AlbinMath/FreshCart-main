import os
import joblib
import numpy as np

class SellerEvaluator:
    def __init__(self):
        self.model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
        self.scaler_path = os.path.join(os.path.dirname(__file__), 'scaler.pkl')
        self.model = None
        self.scaler = None
        self.load_model()

    def load_model(self):
        if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
            self.model = joblib.load(self.model_path)
            self.scaler = joblib.load(self.scaler_path)
        else:
            print("Model files not found. Please run train_model.py first.")

    def predict_performance(self, avg_overall, avg_quality, avg_delivery, review_count, order_volume, fulfillment_rate, account_age):
        if self.model is None or self.scaler is None:
            return {"tier": "Unknown", "message": "Model not loaded", "score": 0}

        # Prepare features (Must match X_cols in train_model.py)
        # ['overallRate', 'qualityRate', 'deliveryRate', 'review_count', 'order_volume', 'fulfillment_rate', 'account_age_days']
        features = np.array([[avg_overall, avg_quality, avg_delivery, review_count, order_volume, fulfillment_rate, account_age]])
        features_scaled = self.scaler.transform(features)

        # Get prediction and probabilities
        tier_idx = self.model.predict(features_scaled)[0]
        probs = self.model.predict_proba(features_scaled)[0]
        confidence = float(np.max(probs))

        tiers = ["Poor", "Average", "Good", "Excellent"]
        tier_name = tiers[int(tier_idx)]

        return {
            "tier": tier_name,
            "tier_index": int(tier_idx),
            "confidence": confidence,
            "metrics": {
                "overall": avg_overall,
                "quality": avg_quality,
                "delivery": avg_delivery,
                "review_count": review_count,
                "order_volume": order_volume,
                "fulfillment_rate": fulfillment_rate,
                "account_age": account_age
            }
        }
