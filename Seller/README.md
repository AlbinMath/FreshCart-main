# 🏪 FreshCart Seller Dashboard

A powerful merchant interface that empowers sellers to manage their store, inventory, and fulfillment operations with data-driven insights.

## ✨ Features

- **Store Overview**: Real-time sales metrics, order counts, and revenue analytics.
- **[AI Performance Intelligence](./python)**: Multidimensional Support Vector Machine (SVM) analysis of seller performance. Classifies sellers into tiers (Excellent, Good, Average, Poor) with real-time tracking of successful vs failed deliveries.
- **Inventory Management**: Easy tools for adding products, managing stock levels, and setting prices.
- **C2B Sourcing Integration**: Integrated sourcing platform where sellers can acquire produce directly from growers with AI-verified performance indicators.
- **Order Fulfillment**: Streamlined workflow for managing incoming orders and dispatching through the Intelligent Dispatch System.
- **Reports & Analytics**: Detailed CSV exports and visual charts for store performance.
- **Marketing & Coupons**: Create and manage high-impact coupons and flash sales.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui.
- **Backend API**: Node.js, Express, Mongoose.
- **Intelligence Service**: Python 3.12, Scikit-learn (SVM), Pandas, Joblib.
- **Analytics**: Recharts for real-time visualization.

## 🚀 Getting Started

### 1. Environment Setup
Create a `.env` file in the `python` directory and `Backend` directory:
```env
PORT=5002
PYTHON_PORT_SELLER=6002
MONGODB_URI_Products=your_mongodb_uri
MONGODB_URI_Users=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

### 2. Run Services

FreshCart Seller requires both the Node.js backend and the Python Analytics service.

**Terminal 1: Node.js Backend**
```bash
cd Backend && npm install && npm run dev
```

**Terminal 2: Python Analytics Service**
```bash
cd python
pip install -r requirements.txt
python app.py
```

**Terminal 3: Frontend**
```bash
cd Frontend && npm install && npm run dev
```
