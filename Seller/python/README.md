# 🧠 Seller Performance Intelligence Service (SVM)

This microservice provides AI-driven performance analysis for FreshCart sellers using a Support Vector Machine (SVM) classification model. It analyzes multidimensional metrics to categorize sellers into performance tiers and provides actionable insights.

## 📊 Core Functionality

- **SVM Classification**: Utilizes a non-linear Radial Basis Function (RBF) kernel to classify sellers into four tiers: `Excellent`, `Good`, `Average`, and `Poor`.
- **Real-Time Evaluation**: Dynamically calculates performance metrics from live MongoDB data (Reviews, Orders, and Account Age).
- **Predictive Metrics**:
  - `Quality Score`: Based on product reviews.
  - `Delivery Reliability`: Based on customer delivery feedback.
  - `Fulfillment Rate`: Ratio of successful deliveries to total orders.
  - `Cancellation Rate`: Tracking failures to influence tier adjustments.
- **Model Retraining**: Built-in endpoint to retrain the SVM model with the latest historical data to adapt to changing store trends.

## 🛠️ Tech Stack

- **Python 3.12+**
- **Flask**: Lightweight REST API.
- **Scikit-Learn**: Machine learning library for the SVM model.
- **Pandas/NumPy**: Data manipulation and statistical analysis.
- **PyMongo**: MongoDB driver for real-time data fetching.
- **Joblib**: Model serialization and persistence.

## 🚀 API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/evaluate/<seller_id>` | `GET` | Returns AI performance tier, confidence score, and detailed metrics for a specific seller. |
| `/train` | `POST` | Triggers a full retraining of the SVM model using the current database state. |
| `/health` | `GET` | Service status and capability check. |

## ⚙️ Configuration

Create a `.env` file in this directory:

```env
MONGODB_URI_Products=your_mongodb_uri
MONGODB_URI_Users=your_mongodb_uri
PYTHON_PORT_SELLER=6002
```

## 🏃 Quick Start

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Train Initial Model**:
   ```bash
   python SVM/train_model.py
   ```

3. **Run the Service**:
   ```bash
   python app.py
   ```

## 🔍 Model Logic

The model uses a weighted scoring system for labeling its initial training set:
- **50% Review Score**: Average of overall, quality, and delivery ratings.
- **30% Fulfillment Score**: Based on delivery success rate.
- **20% Experience Score**: Based on account age.

The SVM then learns patterns from these features to provide high-confidence predictions even with incomplete data points.
