import os
import pandas as pd
import numpy as np
from pymongo import MongoClient
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

def get_db_connections():
    try:
        product_uri = os.getenv("MONGODB_URI_Products")
        users_uri = os.getenv("MONGODB_URI_Users")
        
        p_client = MongoClient(product_uri)
        u_client = MongoClient(users_uri)
        
        return p_client.get_database(), u_client.get_database()
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return None, None

def fetch_seller_data():
    p_db, u_db = get_db_connections()
    if p_db is None or u_db is None:
        return None

    # --- 0. Build ID Unification Map ---
    # Map every possible ID (ObjectID, string ID, sellerUniqueId) to a primary string ID
    users_cursor = list(u_db.Users.find({"role": "seller"}, {"_id": 1, "sellerUniqueId": 1, "createdAt": 1}))
    id_to_primary = {}
    seller_age_map = {}
    
    from datetime import datetime
    for u in users_cursor:
        primary_id = str(u["_id"])
        id_to_primary[primary_id] = primary_id
        if "sellerUniqueId" in u:
            id_to_primary[str(u["sellerUniqueId"])] = primary_id
        
        # Calculate age
        created_at = u.get('createdAt')
        age = (datetime.now() - created_at).days if isinstance(created_at, datetime) else 30
        seller_age_map[primary_id] = age

    # --- 1. Fetch Reviews & Map to Primary Seller ---
    reviews_cursor = p_db.Reviews.find()
    reviews_df = pd.DataFrame(list(reviews_cursor))
    
    if reviews_df.empty:
        print("No reviews found for training.")
        return None

    products_cursor = p_db.products.find({}, {"_id": 1, "sellerId": 1, "sellerUniqueId": 1})
    # Map product to primary seller ID
    product_to_primary = {}
    for p in products_cursor:
        sid = str(p.get("sellerId") or p.get("sellerUniqueId"))
        product_to_primary[str(p["_id"])] = id_to_primary.get(sid, sid)

    reviews_df['sellerId'] = reviews_df['productId'].map(product_to_primary)
    reviews_df = reviews_df.dropna(subset=['sellerId'])

    seller_review_stats = reviews_df.groupby('sellerId').agg({
        'overallRate': 'mean',
        'qualityRate': 'mean',
        'deliveryRate': 'mean',
        '_id': 'count'
    }).rename(columns={'_id': 'review_count'})

    # --- 2. Fetch Orders & Map to Primary Seller ---
    # Query all possible ID fields
    orders_cursor = p_db.Orders.find({}, {"sellerId": 1, "items.sellerId": 1, "sellerUniqueId": 1, "status": 1})
    
    order_data = []
    for o in orders_cursor:
        # Get all unique sellers in this order
        order_sids = set()
        if o.get('sellerId'): order_sids.add(str(o['sellerId']))
        if o.get('sellerUniqueId'): order_sids.add(str(o['sellerUniqueId']))
        
        if o.get('items'):
            for item in o['items']:
                if item.get('sellerId'):
                    order_sids.add(str(item['sellerId']))
                # Also try to map via productId if sellerId is missing on item
                elif item.get('productId'):
                    pid = str(item['productId'])
                    if pid in product_to_primary:
                        order_sids.add(product_to_primary[pid])

        # Attribute the order status to each seller involved
        status = str(o.get('status', '')).strip().lower()
        for raw_sid in order_sids:
            sid = id_to_primary.get(raw_sid, raw_sid)
            order_data.append({'sellerId': sid, 'status': status})

    orders_df = pd.DataFrame(order_data)
    
    if not orders_df.empty:
        seller_order_stats = orders_df.groupby('sellerId').agg({
            'status': [
                ('order_volume', 'count'), 
                ('fulfillment_rate', lambda x: (x == 'delivered').sum() / len(x) if len(x) > 0 else 0)
            ]
        })
        seller_order_stats.columns = ['order_volume', 'fulfillment_rate']
    else:
        seller_order_stats = pd.DataFrame(columns=['order_volume', 'fulfillment_rate'])

    # --- 3. Build Account Age stats from our pre-collected map ---
    seller_age_stats = pd.DataFrame.from_dict(seller_age_map, orient='index', columns=['account_age_days'])
    seller_age_stats.index.name = 'sellerId'

    # Merge all datasets
    combined_data = seller_review_stats.join(seller_order_stats, how='left').join(seller_age_stats, how='left')
    
    # Fill missing values
    combined_data['order_volume'] = combined_data['order_volume'].fillna(0)
    combined_data['fulfillment_rate'] = combined_data['fulfillment_rate'].fillna(0.5)
    combined_data['account_age_days'] = combined_data['account_age_days'].fillna(30)

    # Labeling Logic (Weighted Score)
    def label_seller(row):
        # 50% Review, 30% Fulfillment, 20% experience
        review_score = (row['overallRate'] + row['qualityRate'] + row['deliveryRate']) / 3
        fulfillment_score = row['fulfillment_rate'] * 5
        age_score = min(row['account_age_days'] / 365, 1) * 5 # Max 1 year for age factor
        
        total_score = (review_score * 0.5) + (fulfillment_score * 0.3) + (age_score * 0.2)
        
        if total_score < 2.5: return 0
        if total_score < 3.5: return 1
        if total_score < 4.5: return 2
        return 3

    combined_data['performance_tier'] = combined_data.apply(label_seller, axis=1)
    return combined_data

def train_svm():
    print("Starting SVM Training...")
    data = fetch_seller_data()
    
    if data is None or len(data) < 5:
        # If not enough data, use synthetic data to initialize the model
        print("Not enough real data. Generating synthetic data for initial model...")
        synthetic_data = []
        for _ in range(100):
            # Generate random but somewhat realistic scores
            tier = np.random.choice([0, 1, 2, 3])
            if tier == 0: # Poor
                scores = np.random.uniform(1, 2.8, 3)
                fulfillment = np.random.uniform(0.1, 0.5)
                age = np.random.randint(1, 30)
            elif tier == 1: # Average
                scores = np.random.uniform(2.5, 3.8, 3)
                fulfillment = np.random.uniform(0.4, 0.8)
                age = np.random.randint(30, 90)
            elif tier == 2: # Good
                scores = np.random.uniform(3.5, 4.5, 3)
                fulfillment = np.random.uniform(0.7, 0.95)
                age = np.random.randint(60, 200)
            else: # Excellent
                scores = np.random.uniform(4.3, 5.0, 3)
                fulfillment = np.random.uniform(0.9, 1.0)
                age = np.random.randint(100, 500)
            
            synthetic_data.append([
                scores[0], scores[1], scores[2], 
                np.random.randint(1, 100), # review_count
                np.random.randint(1, 500), # order_volume
                fulfillment, age, tier
            ])
        
        data = pd.DataFrame(synthetic_data, columns=[
            'overallRate', 'qualityRate', 'deliveryRate', 
            'review_count', 'order_volume', 'fulfillment_rate', 
            'account_age_days', 'performance_tier'
        ])

    X_cols = ['overallRate', 'qualityRate', 'deliveryRate', 'review_count', 'order_volume', 'fulfillment_rate', 'account_age_days']
    X = data[X_cols]
    y = data['performance_tier']

    # Scale data
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Split (optional for small datasets but good practice)
    X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

    # Train SVM Classifier
    model = SVC(kernel='rbf', C=1.0, gamma='scale', probability=True)
    model.fit(X_train, y_train)

    # Save model and scaler
    model_path = os.path.join(os.path.dirname(__file__), 'model.pkl')
    scaler_path = os.path.join(os.path.dirname(__file__), 'scaler.pkl')
    
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)
    
    print(f"Model trained and saved to {model_path}")
    print(f"Accuracy on test set: {model.score(X_test, y_test):.2f}")

if __name__ == "__main__":
    train_svm()
