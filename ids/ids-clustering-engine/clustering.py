import numpy as np
from sklearn.cluster import DBSCAN
import pandas as pd

def cluster_orders(orders_list):
    """
    Groups orders using DBSCAN.
    Assumes inputs are Pydantic models (id, longitude, latitude, volume, priority)
    """
    if len(orders_list) == 0:
        return []

    # Extract coordinates
    coords = np.array([[o.latitude, o.longitude] for o in orders_list])
    
    # DBSCAN implementation. 
    # EPS is in degrees (~1km is roughly 0.009 degrees, but Haversine metric is better for real world)
    # Using simple Euclidean for MVP, adjusting eps to roughly 2km
    eps_degrees = 0.018 
    min_samples = 3 

    # For less than min_samples, DBSCAN will categorise as noise.
    # We dynamically lower min_samples if very few orders exist.
    if len(coords) < min_samples:
        min_samples = 1

    db = DBSCAN(eps=eps_degrees, min_samples=min_samples, metric='euclidean').fit(coords)
    labels = db.labels_

    clusters_output = []
    
    # Unique labels, -1 is noise (outliers)
    unique_labels = set(labels)
    
    for k in unique_labels:
        # Get orders for this cluster
        class_member_mask = (labels == k)
        cluster_orders = [orders_list[i] for i in range(len(orders_list)) if class_member_mask[i]]
        
        # Calculate centroid
        cluster_coords = coords[class_member_mask]
        centroid_lat = np.mean(cluster_coords[:, 0])
        centroid_lon = np.mean(cluster_coords[:, 1])
        
        # Total volume
        total_volume = sum([o.volume for o in cluster_orders])

        clusters_output.append({
            "is_outlier": bool(k == -1),
            "centroid": {"latitude": centroid_lat, "longitude": centroid_lon},
            "total_volume": total_volume,
            "order_ids": [o.id for o in cluster_orders]
        })

    return clusters_output
