# 🛒 FreshCart Customer Portal

The flagship storefront of FreshCart. A high-performance, responsive e-commerce application designed for a premium shopping experience.

## ✨ Features

- **Dynamic Storefront**: Advanced filtering, categorization, and search for thousands of products.
- **Secure Checkout**: Integrated with **Razorpay** for seamless digital payments.
- **Grower Portal (C2B)**: A unique feature allowing customers/growers to propose their own produce for sourcing by sellers.
- **AI-Verified Sourcing**: Integrated indicators showing grower reliability based on system-wide metrics.
- **Flash Sales**: Real-time discounted price tags and countdown timers for limited-time offers.
- **Order Tracking**: Live status updates with map integration and historical order tracking.
- **Profile Management**: Multiple address support, order history, and security settings.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion (Animations), react-hot-toast, lucide-react.
- **Backend**: Node.js, Express, Mongoose.
- **Payments**: Razorpay SDK.
- **Maps**: Leaflet / React-Leaflet.

## 🚀 Getting Started

### 1. Environment Setup
Create a `.env` file in the `Backend` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

### 2. Installation
```bash
# Backend
cd Backend && npm install

# Frontend
cd Frontend && npm install
```

### 3. Run
```bash
# Terminal 1: Backend
cd Backend && npm run dev

# Terminal 2: Frontend
cd Frontend && npm run dev
```
