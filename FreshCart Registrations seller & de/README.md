# 📝 FreshCart Onboarding Portal

The entry point for new partners wishing to join the FreshCart platform as Sellers or Delivery Agents.

## ✨ Features

- **Merchant Onboarding**: Multi-step registration for sellers including business details and product categories.
- **Agent Onboarding**: Application portal for delivery agents with vehicle and document verification.
- **Document Management**: Secure upload system for IDs, licenses, and permits via Cloudinary.
- **Status Tracking**: Real-time feedback for applicants on their approval progress.
- **Communication Hub**: Built-in chat for partners to coordinate with platform administrators during onboarding.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS.
- **Backend**: Node.js, Express, Mongoose.
- **Storage**: Cloudinary for digital document verification.

## 🏗️ Structure

- `frontend/`: React-based onboarding application.
- `backend/`: Node.js/Express API managing partner applications and document verification.

## 🚀 Getting Started

### 1. Environment Setup
Create a `.env` file in the `backend` directory:
```env
PORT=5004
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### 2. Run
```bash
# Terminal 1: Backend
cd backend && npm install && npm run dev

# Terminal 2: Frontend
cd frontend && npm install && npm run dev
```
