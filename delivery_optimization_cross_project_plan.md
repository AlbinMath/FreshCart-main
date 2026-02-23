# Cross-Project Feature Integration: Intelligent Dispatch System (IDS)

This plan outlines how the new IDS microservice will be woven into the workflows of the existing system components (`Seller`, `Delivery`, `Shared`, `Tax`, `FreshCart Registrations`, `Customer`, `Chatbot`, and `Administrator`).

## 1. System Integration Points

### 1.1 Customer & Seller (Order Creation Phase)
*   **Goal:** When a customer places an order, or a seller approves an order shipment, the order data needs to be pushed into the IDS queue for clustering.
*   **Action:** 
    *   Locate the "Checkout" or "Order Completion" controllers in the `Customer` backend.
    *   Locate the "Update Order Status" endpoints in the `Seller` backend.
    *   Inject an HTTP POST request to `IDS_CORE_API_URL/api/orders` to register the new delivery coordinates, priority, and volume with the IDS engine whenever an order is marked ready for dispatch.

### 1.2 Delivery (Agent App Phase)
*   **Goal:** The `Delivery` application is the primary consumer of the IDS. It needs to register agents, update their GPS locations continuously, and receive assignments.
*   **Action:** 
    *   **On Login/Duty Start:** The `Delivery` backend should send a POST to `IDS_CORE_API_URL/api/agents` to register the delivery driver's capacity and details in the IDS database.
    *   **GPS Tracking Loop:** The delivery frontend/backend needs a job or webhook that constantly pushes coordinates to `IDS_CORE_API_URL/api/agents/update-location`.
    *   **Assignment Reception:** The `Delivery` frontend should listen to the Socket.io `agent_moved` and `dispatch_completed` events streaming from the IDS core API to update their UI with new cluster zones.

### 1.3 Administrator (Dispatch & Monitoring Phase)
*   **Goal:** The `Administrator` is the controller of the IDS. Admin users need the ability to manually trigger the machine learning algorithm.
*   **Action:**
    *   Add a visual button to the Admin frontend: "Run Auto-Dispatch Engine".
    *   Wire this button in the Admin backend to fire `POST IDS_CORE_API_URL/api/dispatch/trigger`.
    *   Listen for the response and visualize the newly generated delivery clusters/routes.

### 1.4 Tax & Order Integrity (Shared)
*   **Goal:** Integrate the delivery optimization data into the final order ledger for auditing.
*   **Action:**
    *   When the IDS successfully completes a delivery sequence, it should log a blockchain block update to the `Shared/Orderintegrity` API (`POST /create-next`) proving the order was dispatched via the optimized DBSCAN route.
    *   The `Tax` module can be updated to factor in the optimized "Fuel Saved" metric into the final delivery cost calculation.

### 1.5 Chatbot
*   **Goal:** Allow users or admins to query the bot about dispatch status.
*   **Action:** Add an intent to the `Chatbot` backend that queries `IDS_CORE_API_URL/api/orders/pending` and returns how many orders are currently waiting for the machine learning clustering engine.

### 1.6 FreshCart Registrations (Seller & Delivery Users)
*   **Goal:** Sync user registries with the IDS.
*   **Action:** When a new delivery driver is approved through the registration portal, automatically seed their profile into the IDS Agent database.

---

## 2. Next Steps & Development Checklist

To begin implementing this, we need to locate the exact controller files in your existing projects. Since this requires injecting code into dozens of your other APIs, we will tackle them one by one.

**Phase 1 Recommendation: Customer & Seller Order Push**
Shall we start by finding the "Create Order" logic in the Customer/Seller backend and adding the API call that pushes order GPS coordinates into the IDS?
