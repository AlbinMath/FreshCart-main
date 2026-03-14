# 🛡️ FreshCart Administrator Dashboard

The Central Nervous System of the FreshCart ecosystem. This portal allows administrators to oversee all platform activities, moderate users, and manage financial/tax compliance.

## ✨ Features

- **Dashboard Overview**: Real-time visualization of platform health, sales trends, and active users.
- **User & Role Management**: Comprehensive control over Customer, Seller, and Delivery Agent accounts.
- **Product Approval**: Quality gate for items added by sellers before they go live on the storefront.
- **Marketing Control**: Centralized management of flash sales, seasonal discounts, and promotional coupons.
- **Reports & Analytics**: Advanced visualization of platform revenue, user growth, and order statistics with CSV export capabilities.
- **Payment & Financials**: Monitoring Razorpay transactions, processing seller payouts, and tracking platform fees.
- **Tax Compliance**: Dedicated interface for managing GST and TCS settings in coordination with the Tax Microservice.
- **Sourcing Management**: Oversight of the C2B (Grower) sourcing pipeline.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express, Mongoose.
- **Communication**: RESTful APIs.

## 🚀 Getting Started

### 1. Environment Setup
Create a `.env` file in the `backend` directory:
```env
PORT=5001
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

### 2. Installation
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### 3. Run
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```
