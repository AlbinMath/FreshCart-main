# 🌎 IDS Clustering Engine

Advanced geospatial clustering service for FreshCart's logistics optimization.

## 🚀 Purpose
To solve the "Last-Mile Delivery Problem" by grouping orders that are geographically close, allowing a single delivery agent to handle multiple deliveries in a single run, reducing operational costs and delivery time.

## 🧪 Algorithms

### 1. DBSCAN (Density-Based Spatial Clustering)
- **Why**: Unlike K-Means, DBSCAN doesn't require us to pre-specify the number of clusters. It identifies "neighborhoods" of orders and effectively ignores "noise" (isolated orders that shouldn't be batched).
- **Parameters**: 
  - `epsilon`: The maximum distance between two samples for them to be considered as in the same neighborhood.
  - `min_samples`: The number of samples in a neighborhood for a point to be considered as a core point.

### 2. Haversine Formula
- Used to calculate accurate distances between latitude/longitude coordinates on the Earth's surface.

## 🛠️ Configuration

Dependencies are listed in `requirements.txt`.
- `scikit-learn`: For clustering algorithms.
- `pandas/numpy`: For data processing.
- `flask/fastapi`: For the API interface.

## 🚀 Run
```bash
python -m venv venv
source venv/Scripts/activate
pip install -r requirements.txt
python main.py
```
