<div align="center">
  <img src="https://raw.githubusercontent.com/AlbinMath/FreshCart-main/main/Customer/Frontend/src/assets/logo.png" alt="FreshCart Logo" width="120" />
  <h1>🛒 FreshCart</h1>
  <p><strong>A Premium Multi-Service E-Commerce & Last-Mile Delivery Ecosystem</strong></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/Frontend-React%2018-blue)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green)](https://nodejs.org/)
  [![Python](https://img.shields.io/badge/Engine-Python%203.9-blue)](https://python.org/)
  [![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)](https://www.mongodb.com/)
</div>

---

## 📖 Overview

**FreshCart** is a sophisticated, modular e-commerce ecosystem built with a microservices-oriented architecture. It provides a seamless experience for customers, efficient tools for sellers, a robust dispatch system for delivery agents, and comprehensive oversight for administrators.

The platform is designed for scalability, featuring specialized portals for every stakeholder and an **Intelligent Dispatch System (IDS)** that optimizes logistics through advanced geospatial clustering.

---

## ✨ Key Ecosystem Components

| Portal / Service | Description | Links |
| :--- | :--- | :--- |
| **[Customer Portal](./Customer)** | High-performance storefront with Razorpay integration and a unique "Grower Portal" for C2B sourcing. | [Details](./Customer/README.md) |
| **[Seller Dashboard](./Seller)** | Comprehensive merchant tool for inventory management, order fulfillment, and C2B sourcing analytics. | [Details](./Seller/README.md) |
| **[Delivery Hub](./Delivery)** | Real-time tracking, earnings management, and optimized route assignments for agents. | [Details](./Delivery/README.md) |
| **[Admin Control](./Administrator)** | Centralized platform governance, user/seller approvals, marketing controls, and tax management. | [Details](./Administrator/README.md) |
| **[IDS (Intelligent Dispatch)](./ids)** | The "brain" of FreshCart. Uses Python/ML (DBSCAN/K-Means) for geospatial order batching. | [Details](./ids/README.md) |
| **[AI Chatbot](./chatbot)** | Intelligent support assistant handling order inquiries and platform documentation. | [Details](./chatbot/README.md) |
| **[Tax Microservice](./tax)** | Independent logic for regional GST, TCS, and fee calculations. | [Details](./tax/README.md) |
| **[Onboarding Portal](./FreshCart%20Registrations%20seller%20&%20de)** | Dedicated landing and registration system for new sellers and delivery partners. | [Details](./FreshCart%20Registrations%20seller%20&%20de/README.md) |

---

## 🏗️ Technical Architecture

### **Frontend Excellence**
- **Core**: React 18 + Vite for lightning-fast HMR.
- **Styling**: Tailwind CSS & shadcn/ui for a premium, consistent design language.
- **State & Logistics**: Framer Motion for animations, React Hook Form for validation, and Leaflet for geospatial visualization.

### **Robust Backend**
- **API Runtime**: Node.js & Express.js.
- **Data Persistence**: MongoDB with Mongoose ODM.
- **Security**: JWT-based authentication, Bcrypt password hashing, and role-based access control (RBAC).
- **Integrations**: 
  - **Payments**: Razorpay API.
  - **Media**: Cloudinary CDN via Multer.
  - **Communications**: Real-time updates via Socket.io (where applicable).

### **ML & Intelligence Layer**
- **Language**: Python 3.9+.
- **Services**:
  - **Intelligent Dispatch (IDS)**: DBSCAN & K-Means for geospatial order batching and terminal optimization.
  - **Performance Intelligence (SVM)**: Support Vector Machine (RBF kernel) for seller tiering and risk analysis.
- **NLP**: Intent classification for the customer support chatbot handling order queries.

---

## 📂 Project Structure

```text
📦 FreshCart
 ┣ 📂 Administrator       # Platform governance (React + Node/Express)
 ┣ 📂 Customer            # Main storefront & Grower C2B Portal
 ┣ 📂 Seller              # Merchant operations & Inventory management
 ┣ 📂 Delivery            # Agent dashboard & real-time tracking
 ┣ 📂 ids                 # Intelligent Dispatch System (Core API + Python Engine)
 ┣ 📂 chatbot             # AI Support Assistant (Python Backend)
 ┣ 📂 tax                 # Dedicated Tax calculation microservice
 ┣ 📂 Shared              # Order integrity & shared utilities
 ┣ 📂 FreshCart Reg...    # Onboarding portal for sellers/agents
 ┗ 📜 README.md           # Master documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v16+
- **Python**: 3.9+
- **MongoDB**: Local or Atlas instance
- **Environment Keys**: Cloudinary, Razorpay, and JWT secrets (see sub-module READMEs for `.env` templates).

### Installation & Execution

1. **Clone the Repo:**
   ```bash
   git clone https://github.com/AlbinMath/FreshCart-main.git
   cd FreshCart-main
   ```

2. **Run Services:**
   FreshCart is a multi-service platform. To run the full stack, you need to start the respective frontend and backend for the portal you wish to use.
   
   *Example: Starting the Customer Portal*
   ```bash
   # Terminal 1: Backend
   cd Customer/Backend && npm install && npm run dev
   
   # Terminal 2: Frontend
   cd Customer/Frontend && npm install && npm run dev
   ```

3. **Run IDS Engine (Python):**
   ```bash
   cd ids/ids-clustering-engine
   python -m venv venv
   source venv/Scripts/activate # Windows
   pip install -r requirements.txt
   python main.py
   ```

---

## 🤝 Contributing

We maintain high code quality standards. Ensure all PRs include:
- Clean, documented code.
- Consistent styling via Tailwind.
- Proper error handling in APIs.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <p>Built with ❤️ by the Albin Mathew</p>
</div>

