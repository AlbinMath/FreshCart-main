# 🚚 FreshCart Delivery Agent Hub

The dedicated portal for FreshCart's last-mile delivery partners. Built for mobile-first speed and reliability.

## ✨ Features

- **Agent Dashboard**: Instant feedback on active orders and daily earnings.
- **Real-Time Tracking**: GPS-integrated tracking for seamless navigation to customer locations.
- **Intelligent Assignment**: Integration with IDS for optimized order pooling and route efficiency.
- **Earnings History**: Detailed logs of completed deliveries and performance-based rewards.
- **Time Online Tracking**: Real-time accurate tracking of active working hours with precise daily resets.
- **Profile & Availability**: Manage online status, vehicle details, and personal settings.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS.
- **Backend**: Node.js, Express, Mongoose.
- **Maps**: Leaflet for real-time geospatial tracking.

## 🚀 Getting Started

### 1. Environment Setup
Create a `.env` file in the `backend` directory:
```env
PORT=5003
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
