# 📦 FreshCart Shared Utilities

A collection of libraries, constants, and integrity checkers shared across the FreshCart ecosystem to ensure data synchronization and security.

## 🏗️ Components

### 🛡️ **Order Integrity & Ledger**
- **Role**: Ensures data consistency and transaction history across Customer, Seller, and Delivery services.
- **Functions**: Validates status transitions (e.g., ensuring an order isn't marked as "Delivered" before it is "Out for Delivery") and maintains a secure audit log.

### 🔌 **Microservice Connectors**
- **Role**: Standardized API helpers for cross-service communication (e.g., Seller dashboard calling the Tax microservice).

## 🛠️ Usage
These utilities are typically referenced in the `package.json` of other services or run as background verification tasks to maintain ecosystem stability.
