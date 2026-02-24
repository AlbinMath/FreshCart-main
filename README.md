<div align="center">
  <h1>🛒 FreshCart</h1>
  <p><strong>A Comprehensive Multi-Service E-Commerce & Last-Mile Delivery Platform</strong></p>
</div>

---

## 📖 Overview

**FreshCart** is a modern, scalable e-commerce platform built on a microservices-inspired architecture. It caters to distinct user roles through dedicated applications, streamlining operations from browsing products to delivering them efficiently using an Intelligent Dispatch System (IDS). 

With specialized frontends and backends for Customers, Sellers, Delivery Agents, and Administrators, FreshCart manages the full product lifecycle seamlessly.

---

## ✨ Key Features & Portals

The platform is divided into domain-specific applications:

- **Customer Portal**: End-user storefront for browsing categories, managing cart, secure checkout (Razorpay), order tracking, and account management.
- **Seller Portal**: Merchant dashboard for adding and managing inventory, viewing store analytics, and tracking seller orders.
- **Delivery Agent Portal**: Interface tailored for drivers featuring map integrations, order assignments, route optimization, and delivery status updates.
- **Administrator Dashboard**: Centralized management interface for overseeing platforms, users, approving sellers, and overall platform monitoring.
- **Intelligent Dispatch System (IDS)**: Advanced geospatial clustering engine and routing algorithm that optimizes order distribution to delivery agents efficiently.
- **AI Chatbot**: Intelligent customer support assistant capable of handling order inquiries, policies, reporting, and general QA seamlessly.
- **Centralized Tax Service**: A dedicated microservice managing regional GST, TCS, and fee calculations securely.

---

## 🏗️ Architecture Stack

FreshCart is built utilizing modern frameworks suitable for highly responsive UI development and fast, asynchronous backend performance.

### **Frontend & UI layer**
- **Framework**: [React.js](https://reactjs.org/) (v18) initialized via Vite ⚡
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/) based UI components (Radix UI)
- **Routing**: `react-router-dom` 
- **Mapping**: Leaflet & `react-leaflet` (for tracking / delivery)
- **State/Notifications**: `axios` for HTTP, `react-hot-toast` for toasts

### **Backend & APIs**
- **Server Environment**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Database Model**: [MongoDB](https://www.mongodb.com/) (using Mongoose object modeling)
- **Authentication**: JWT authentication & `bcryptjs`
- **File Storage/CDNs**: [Cloudinary](https://cloudinary.com/) (for product & profile images using Multer)
- **Payments**: Razorpay Integration (via Customer backend)

### **Machine Learning & Algorithms (Chatbot & IDS)**
- **Language**: Python 🐍
- **Clustering / ML**: Geospatial location clustering using DBSCAN/K-Means for delivery order pooling. Intent classification for chatbot.

---

## 📂 Project Structure

```text
📦 FreshCart
 ┣ 📂 Administrator       # React Frontend + Node/Express Backend for platform management
 ┣ 📂 Customer            # E-Commerce storefront + Backend logic/Razorpay integration
 ┣ 📂 Seller              # Merchant/Vendor dashboard + Inventory management APIs
 ┣ 📂 Delivery            # Agent order assignment UI + delivery status APIs
 ┣ 📂 ids                 # Intelligent Dispatch System (Core API in Node.js, Engine in Python)
 ┣ 📂 chatbot             # Python-powered FAQ & Order support assistant
 ┣ 📂 tax                 # Independent Tax/Fee calculation microservice
 ┣ 📂 Shared              # Shared constants, Order integrity, and utilities
 ┗ 📜 .gitignore          # Root level git rules
```

---

## 🚀 Getting Started

To run the various microservices locally, you must provide `.env` configuration files for each respective backend (including MongoDB URIs, Cloudinary Secrets, JWT secrets, and Payment keys).

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- Python 3.9+ (For Chatbot & IDS engine)
- MongoDB instance (Local or Atlas)

### General Run Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AlbinMath/FreshCart-main.git
   cd FreshCart-main
   ```

2. **Start a specific service (Example: Customer Portal):**
   *Terminal 1 - Backend:*
   ```bash
   cd Customer/Backend
   npm install
   npm run dev
   ```
   *Terminal 2 - Frontend:*
   ```bash
   cd Customer/Frontend
   npm install
   npm run dev
   ```

*(Note: Repeat the above pattern for Administrator, Seller, and Delivery applications depending on what you want to test.)*

3. **Start Python Services (e.g., IDS Engine):**
   ```bash
   cd ids/ids-clustering-engine
   python -m venv venv
   source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
   pip install -r requirements.txt
   python main.py
   ```

---

## 🤝 Contributing

This project is actively developed. We enforce clean code standards (ESLint configured across projects). Create feature branches and submit pull requests for any contributions targeting the `main` branch.

## 📄 License
Check the `LICENSE` file in the root repository for specific usage rights.
