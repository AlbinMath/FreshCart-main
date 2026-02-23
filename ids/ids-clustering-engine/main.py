from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from clustering import cluster_orders
from routing import optimize_route

app = FastAPI(title="IDS Clustering Engine")

class Order(BaseModel):
    id: str
    longitude: float
    latitude: float
    priority: int = 1
    volume: float = 1.0

class ClusterRequest(BaseModel):
    orders: List[Order]

class RouteRequest(BaseModel):
    agent_location: dict # {"longitude": float, "latitude": float}
    order_ids: List[str]

@app.post("/engine/cluster")
async def perform_clustering(request: ClusterRequest):
    if not request.orders:
        raise HTTPException(status_code=400, detail="No orders provided")
    
    # Run DBSCAN
    clusters = cluster_orders(request.orders)
    return {"clusters": clusters}

@app.post("/engine/optimize-route")
async def perform_routing(request: RouteRequest):
    if not request.order_ids:
        raise HTTPException(status_code=400, detail="No orders to route")
    
    # Run TSP Heuristic
    sequence = optimize_route(request.agent_location, request.order_ids)
    return {"route_sequence": sequence}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
