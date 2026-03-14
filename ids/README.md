# 🧠 Intelligent Dispatch System (IDS)

The logical core of FreshCart's logistics. IDS is responsible for the intelligent grouping and assignment of orders to delivery agents.

## 🏗️ Modules

### 1. **IDS Core API** (`ids-core-api`)
- **Language**: Node.js/Express.
- **Role**: Serves as the gateway between the main platform (Order service) and the Clustering Engine.
- **Functions**: Manages order queues, agent availability status, and serves finalized clusters.

### 2. **Clustering Engine** (`ids-clustering-engine`)
- **Language**: Python 3.9+.
- **Algorithms**: 
  - **DBSCAN**: Density-Based Spatial Clustering of Applications with Noise. Used to group delivery locations based on proximity while identifying outliers.
  - **K-Means**: Used for centroid calculation and regional load balancing.
- **Role**: Processes raw geospatial data and returns optimized order "pools" (clusters).

## 🚀 Setup & Execution

### Running the Python Engine
```bash
cd ids-clustering-engine
python -m venv venv
source venv/Scripts/activate # Windows
pip install -r requirements.txt
python main.py
```

### Running the Core API
```bash
cd ids-core-api
npm install
npm start
```

## 📊 How it Works
1. When a threshold of orders is reached or a timer elapses, the Core API pushes geospatial data to the Python Engine.
2. The Engine runs DBSCAN to identify high-density delivery areas.
3. Groups are formed into "Batch Orders" and assigned to the nearest available Delivery Agent via the Hub.
