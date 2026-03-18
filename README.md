<div align="center">

  <h1>🛒 FreshCart</h1>
  <p><strong>A Premium Multi-Service E-Commerce & Last-Mile Delivery Ecosystem</strong></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/Frontend-React%2018-blue)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-green)](https://nodejs.org/)
  [![Python](https://img.shields.io/badge/Engine-Python%203.9-blue)](https://python.org/)
  [![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)](https://www.mongodb.com/)
</div>

## 📖 Project Overview

The project titled **“FreshCart”** is an innovative web-based platform designed to connect local fresh product sellers with customers through a seamless, technology-driven marketplace. FreshCart aims to digitalize the buying and selling of fresh items—including vegetables, fruits, dairy products, and meats—ensuring timely delivery, transparency, and convenience for all stakeholders.

In many neighborhoods, customers face challenges in obtaining fresh, high-quality products due to limited availability, fluctuating prices, and minimal direct interaction with sellers. Similarly, small-scale sellers and farmers struggle to reach a wider customer base and manage their sales efficiently. FreshCart addresses these challenges by offering a unified, community-oriented e-commerce solution that empowers both sellers and consumers.

The platform enables customers to explore a wide range of fresh products, categorized with intuitive filters and search functionalities. Users can easily add items to their shopping cart, manage quantities, and complete secure checkout using multiple payment options. Real-time order tracking and delivery status updates enhance transparency and customer satisfaction, while integrated feedback and rating systems ensure consistent product quality and service reliability.

A standout feature of FreshCart is its **dual-role capability**, allowing customers to also act as sellers. Users can list their own fresh or homemade products for sale to nearby buyers, promoting local entrepreneurship and sustainable commerce. This feature reduces reliance on large distributors, strengthens community engagement, and fosters a vibrant, hyperlocal marketplace.

Security and authentication are integral to FreshCart. The system employs **multi-factor authentication (MFA)**, role-based access control, email verification, and JWT-based session management. Sensitive information is safeguarded with bcrypt encryption, and robust validation mechanisms ensure the accuracy of business registration details and product information.

The **Admin Panel** serves as the central control hub, enabling administrators to manage users, monitor system activity, approve new sellers or stores, verify documents, and moderate content. Real-time analytics and performance statistics support informed decision-making and operational efficiency.

The **Seller Module** provides tools for managing stores, listing products, tracking inventory, and analyzing sales. Sellers can update stock levels, manage incoming orders, define business hours, and monitor revenue trends via an interactive dashboard.

The **Customer Module** emphasizes a smooth shopping experience. Users can manage personal information, multiple delivery addresses, password settings, order history, and receive personalized product recommendations based on prior purchases. The module also allows customers to list products for sale to local buyers, seamlessly integrating the buying and selling experience within the same platform.

FreshCart’s **Delivery System** incorporates real-time tracking and verification. Delivery agents are authenticated using license and vehicle registration details, and order completion is confirmed with an **OTP-based system** to ensure accountability and reliability.

Technically, the platform leverages modern web technologies. The frontend is built with **React 18 and Vite** for high-speed rendering, **Tailwind CSS** for responsive design, and **React Router** for client-side navigation. Real-time updates use **WebSocket and Socket.IO**, while form validation and state management are handled through **Formik, Yup, and React Query**. The backend is powered by **Node.js and Express**, with **MongoDB and Mongoose** for data storage and modeling.

FreshCart follows a **monorepo architecture** with separate frontend and backend directories, promoting modularity and maintainability. Additional security measures include API rate limiting, CORS, and CSRF protection, ensuring a reliable and secure platform.

In summary, FreshCart is more than an online delivery app—it is a smart local commerce ecosystem that modernizes the way people buy and sell fresh products. By connecting producers directly to consumers and enabling customers to sell to nearby buyers, FreshCart enhances product freshness, operational transparency, and community-driven commerce, fostering sustainable economic growth in local neighbourhoods.

---

## ✨ Key Ecosystem Components

| Portal / Service | Description | Links |
| :--- | :--- | :--- |
| **[Customer Portal](./Customer)** | High-performance storefront with KNN-based recommendations, Razorpay integration, and a unique **Premium Membership** system. | [Details](./Customer/README.md) |
| **[Seller Dashboard](./Seller)** | Comprehensive merchant tool with **AI Performance Intelligence (SVM)** and real-time stock forecasting. | [Details](./Seller/README.md) |
| **[Grower Portal](./Customer)** | Integrated C2B sourcing engine for local farmers and homemade product sellers to reach nearby buyers directly. | [Details](./Customer/README.md) |
| **[Delivery Hub](./Delivery)** | Real-time tracking, earnings management, and optimized route assignments for agents. | [Details](./Delivery/README.md) |
| **[Admin Control](./Administrator)** | Centralized platform governance, **Premium Delivery Plan** management, and **Marketing Dashboard** (Coupon & Flash Sale) | [Details](./Administrator/README.md) |
| **[IDS (Intelligent Dispatch)](./ids)** | Advanced geospatial dispatching using ML (DBSCAN/K-Means) for optimized last-mile delivery. | [Details](./ids/README.md) |
| **[Microservices System](./Shared)** | Includes **Order Integrity (Blockchain Ledger)** for transaction security and a dedicated **Tax Service**. | [Details](./Shared/OrderIntegrity/README.md) |
| **[AI Support Chatbot](./chatbot)** | Intelligent assistant for automated customer support and system documentation inquiries. | [Details](./chatbot/README.md) |

---

## 🌐 Hosted Links

| Portal | URL |
| :--- | :--- |
| **Admin Frontend** | [https://fresh-cart-main-6cex.vercel.app/](https://fresh-cart-main-6cex.vercel.app/) |
| **Tax Backend** | [https://fresh-cart-main-blond.vercel.app/](https://fresh-cart-main-blond.vercel.app/) |
| **Shared Order Integrity** | [https://fresh-cart-main-4ycz.vercel.app/](https://fresh-cart-main-4ycz.vercel.app/) |
| **AI Chatbot** | [https://fresh-cart-main-3cvf.vercel.app/](https://fresh-cart-main-3cvf.vercel.app/) |
| **Customer Review Analysis** | [https://fresh-cart-main-13ls.vercel.app/](https://fresh-cart-main-13ls.vercel.app/) |

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
- **Language**: Python 3.9+ / Node.js
- **Services**:
  - **Intelligent Dispatch (IDS)**: DBSCAN & K-Means for geospatial order batching and terminal optimization.
  - **AI Performance Intelligence (SVM)**: Support Vector Machine (RBF kernel) for seller performance tiering and risk analysis.
  - **Source Local Produce (Grower Portal)**: C2B sourcing logic for hyperlocal commerce.
  - **Marketing Analytics**: Coupon system and Flash Sale algorithms for dynamic pricing and inventory management.
  - **Recommendation Engine (KNN)**: K-Nearest Neighbors for personalized product discovery.
  - **Order Integrity Service**: Blockchain-inspired hashing and chaining for immutable transaction tracking.
  - **NLP Chatbot**: Intent-based AI for customer support and platform navigation.

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

