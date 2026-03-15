# FreshCart Customer AI Analysis Service

This directory contains the Python-based AI services for the FreshCart customer ecosystem, focusing on personalized recommendations and sentiment analysis.

## 🚀 Overview

The service provides two primary AI-driven functionalities:
1.  **KNN Product Recommender**: A personalized recommendation engine that uses K-Nearest Neighbors to suggest products based on user purchase history, ratings, and current marketing triggers (flash sales/coupons).
2.  **Review Analysis Engine**: A natural language processing (NLP) tool that analyzes customer feedback to determine product sentiment and extract top-performing features.

## 📁 System Architecture

-   `app.py`: Main Flask entry point routing requests to analysis modules.
-   `KNN/`:
    -   `recommender.py`: Core logic for the KNN model, feature engineering, and data scaling.
    -   `__init__.py`: Package indicator.
-   `requerment.txt`: Project dependencies (Pandas, Scikit-learn, TextBlob, Pymongo).

## 🛠 Features

### 1. Personalized Recommendations (KNN)
-   **Cold Start**: Recommends high-rated flash sale products to new users.
-   **Feature Engineering**: Products are mapped to a high-dimensional vector space including:
    -   Normalized pricing and discounts.
    -   Average customer ratings.
    -   Categorical one-hot encoding.
    -   Seller loyalty metrics.
-   **Boosted Results**: Real-time integration with `flashsales` and `coupons` collections ensures timely relevance.

### 2. Sentiment Analysis
-   **Natural Language Processing**: Uses `TextBlob` for polarity calculations.
-   **Weighted Feedback**: Product reviews carry standard weight, while delivery-specific feedback is weighted at 50% for product-focused sentiment.
-   **Feature Extraction**: Automatically identifies and counts frequently praised product attributes (e.g., "Freshness", "Packaging").

## 🚦 Getting Started

### Prerequisites
-   Python 3.10+
-   MongoDB access (configured via `.env`)

### Installation
```bash
pip install -r requerment.txt
```

### Running the Service
```bash
python app.py
```
The service runs on port `6000` by default.

## 📡 API Endpoints

### `POST /recommend`
Request:
```json
{
  "userId": "firebase_uid_here",
  "limit": 5
}
```

### `POST /analyze-reviews`
Request:
```json
{
  "reviews": [
    {
      "reviewText": "Great quality!",
      "overallRate": 5,
      "likeFeatures": ["Freshness"]
    }
  ]
}
```
