# Development Plan: Intelligent Dispatch System (IDS)

This document outlines the step-by-step technical details required to develop the Last-Mile Delivery Optimization project. It serves as a blueprint for when development begins.

## 1. Architecture Setup & Tech Stack Overview

The system will use a Microservices-oriented approach to separate the core web API from the heavy machine learning computations.

*   **Primary Backend (Node.js / Express):** Manages user requests, agent tracking, database CRUD operations, and real-time Socket.io connections.
*   **Clustering Engine (Python / FastAPI):** Dedicated to running Scikit-learn (DBSCAN) and route optimization algorithms (TSP).
*   **Database (MongoDB):** Utilizes `2dsphere` indexes for rapid geospatial querying.
*   **Frontend (React.js):** Dashboard for dispatchers with Mapbox GL integration.

---

## 2. Database Schema Definitions (MongoDB)

### **Orders Collection**
Stores individual delivery tasks.
*   `_id`: ObjectId
*   `order_id`: String (Unique)
*   `customer_name`: String
*   `location`: GeoJSON Point `[longitude, latitude]`
*   `status`: String (`pending`, `clustered`, `assigned`, `in_transit`, `delivered`)
*   `priority`: Integer (1 = Standard, 2 = Express)
*   `volume`: Float (Size/Weight score)
*   `deadline`: Date

### **Agents Collection**
Tracks agent status and capacity.
*   `_id`: ObjectId
*   `agent_id`: String (Unique)
*   `name`: String
*   `current_location`: GeoJSON Point `[longitude, latitude]`
*   `status`: String (`offline`, `available`, `busy`)
*   `capacity`: Float (Total capacity rating)
*   `current_load`: Float (Currently assigned load)

### **Clusters Collection**
Stores output from the Python clustering engine.
*   `_id`: ObjectId
*   `cluster_id`: String
*   `centroid`: GeoJSON Point `[longitude, latitude]`
*   `order_ids`: Array of ObjectIds (Reference to Orders)
*   `assigned_agent_id`: ObjectId (Reference to Agents, nullable initially)
*   `route_sequence`: Array of ObjectIds (Optimized TSP order)

---

## 3. Core API Endpoints

### **Node.js (Core API)**
*   `POST /api/orders`: Create new delivery order.
*   `GET /api/orders/pending`: Fetch all unassigned orders to send to Python.
*   `POST /api/agents/update-location`: Agents app pings this continuously to update GPS.
*   `GET /api/agents/nearby`: Query MongoDB for agents within a specific polygon/radius.
*   `POST /api/dispatch/assign`: Finalize cluster assignment to an agent.

### **Python (Clustering API)**
*   `POST /engine/cluster`: Accepts an array of pending orders, runs DBSCAN, and returns grouped clusters.
*   `POST /engine/optimize-route`: Accepts a cluster and agent start location, returns exact sequence using TSP heuristic.

---

## 4. The Auto-Assignment Logic Flow

When the Node.js server receives clusters from the Python engine, it runs the scoring formula:
`Score = (0.6 * Distance) + (0.3 * Load_Ratio) + (0.1 * Priority_Factor)`

**Pseude-code:**
```javascript
for each cluster in clusters:
   let nearby_agents = find_agents_in_radius(cluster.centroid, 5km)
   let best_agent = null
   let lowest_score = Infinity

   for agent in nearby_agents:
       if agent.status == 'available' and agent.capacity >= cluster_total_load:
           let score = calculate_score(agent, cluster)
           if score < lowest_score:
               lowest_score = score
               best_agent = agent
               
   if best_agent != null:
       assign_cluster_to_agent(cluster, best_agent)
       lock_agent_status(best_agent, 'busy')
```

---

## 5. Phased Development Roadmap

**Phase 1: Foundation (Database & API Shell)**
*   Initialize Git repository.
*   Setup MongoDB Atlas (or local) and define Mongoose schemas with 2dsphere indexing.
*   Build out basic Node.js Express server to handle Order and Agent CRUD.

**Phase 2: The ML Engine (Python)**
*   Setup Python virtual environment.
*   Install `FastAPI`, `uvicorn`, `scikit-learn`, `geopandas`.
*   Write script to generate simulation data (fake coordinates around your city).
*   Implement DBSCAN to consume the fake data and return clusters.

**Phase 3: Integration & Dispatch**
*   Connect Node.js with Python API.
*   Implement the Scoring Formula in Node.js to auto-assign the DBSCAN clusters to agents in the DB.
*   Implement a TSP library (e.g., OR-Tools or custom Genetic Algorithm) to order the stops within a cluster.

**Phase 4: Real-Time Communication**
*   Add `socket.io` to Node.js.
*   Emit WebSockets whenever an order changes status or an agent moves.

**Phase 5: Frontend Map & Dashboard**
*   Initialize React App.
*   Integrate Mapbox GL JS.
*   Plot Orders as red dots, Agents as blue markers.
*   Draw convex hulls/polygons around clustered orders to visualize zones.

---

## 6. Instructions for AI Developer

*(Reserved for when you say "develop it" - The AI will reference this blueprint when instruction is given)*
