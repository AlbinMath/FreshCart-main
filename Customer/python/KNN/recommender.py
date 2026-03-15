import pandas as pd
import numpy as np
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import MinMaxScaler
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

class ProductRecommender:
    def __init__(self):
        self.client = MongoClient(os.getenv('MONGODB_URI_Products'))
        self.users_client = MongoClient(os.getenv('MONGODB_URI_Users'))
        self.db = self.client.get_default_database()
        self.users_db = self.users_client.get_default_database()
        self.model = NearestNeighbors(n_neighbors=5, metric='cosine')
        self.scaler = MinMaxScaler()
        self.products_df = None
        self.feature_matrix = None

    def fetch_data(self):
        # Fetch products
        products = list(self.db.products.find({"status": "active"}))
        if not products:
            return False
        
        self.products_df = pd.DataFrame(products)
        
        # Fetch reviews for average ratings
        reviews = list(self.db.Reviews.find())
        reviews_df = pd.DataFrame(reviews)
        
        if not reviews_df.empty:
            avg_ratings = reviews_df.groupby('productId')['overallRate'].mean().reset_index()
            avg_ratings.columns = ['productId', 'avg_rating']
            self.products_df['_id_str'] = self.products_df['_id'].apply(str)
            self.products_df = self.products_df.merge(avg_ratings, left_on='_id_str', right_on='productId', how='left')
            self.products_df['avg_rating'] = self.products_df['avg_rating'].fillna(0)
        else:
            self.products_df['avg_rating'] = 0

        # Fetch active flash sales
        flash_sales = list(self.db.flashsales.find({"status": "active"}))
        flash_sale_product_ids = [str(fs.get('productId')) for fs in flash_sales]
        self.products_df['is_flash_sale'] = self.products_df['_id_str'].isin(flash_sale_product_ids).astype(int)

        # Fetch active coupons (check if category matches)
        coupons = list(self.db.coupons.find({"isActive": True}))
        # Simplified: if product category is in coupon keywords
        def has_coupon(row):
            for c in coupons:
                keywords = c.get('keywords', [])
                if row['category'] in keywords or row['productName'] in keywords:
                    return 1
            return 0
        self.products_df['has_coupon'] = self.products_df.apply(has_coupon, axis=1)

        return True

    def prepare_features(self):
        if self.products_df is None or self.products_df.empty:
            return
        
        # Features to use
        # 1. Category (One-hot)
        # 2. Price (Normalized)
        # 3. Discount (Normalized)
        # 4. Average Rating (Normalized)
        # 5. Is Flash Sale (1/0)
        # 6. Has Coupon (1/0)
        # 7. Seller (One-hot)

        features = self.products_df[['sellingPrice', 'discount', 'avg_rating', 'is_flash_sale', 'has_coupon']].copy()
        
        # One-hot encode category
        cats = pd.get_dummies(self.products_df['category'], prefix='cat')
        # One-hot encode seller
        sellers = pd.get_dummies(self.products_df['sellerUniqueId'], prefix='seller')
        
        # Combine all
        self.feature_matrix = pd.concat([features, cats, sellers], axis=1)
        
        # Scale numerical features
        cols_to_scale = ['sellingPrice', 'discount', 'avg_rating']
        self.feature_matrix[cols_to_scale] = self.scaler.fit_transform(self.feature_matrix[cols_to_scale])
        
        # Fill NaN
        self.feature_matrix = self.feature_matrix.fillna(0)
        
        # Fit KNN
        self.model.fit(self.feature_matrix)

    def get_user_profile(self, user_id):
        # Fetch user orders
        orders = list(self.db.Orders.find({"userId": user_id, "status": "delivered"}))
        if not orders:
            # If no orders, check reviews
            reviews = list(self.db.Reviews.find({"userId": user_id}))
            if not reviews:
                return None
            product_ids = [str(r['productId']) for r in reviews if r.get('overallRate', 0) >= 3]
        else:
            product_ids = []
            for order in orders:
                for item in order.get('items', []):
                    product_ids.append(str(item.get('productId')))
        
        if not product_ids:
            return None
        
        # Get feature vectors of these products
        user_products_indices = self.products_df[self.products_df['_id_str'].isin(product_ids)].index
        if len(user_products_indices) == 0:
            return None
            
        user_features = self.feature_matrix.iloc[user_products_indices]
            # Average feature vector for user profile
        user_profile = user_features.mean().values.reshape(1, -1)
        # Convert to DataFrame to avoid feature names warning
        user_profile_df = pd.DataFrame(user_profile, columns=self.feature_matrix.columns)
        return user_profile_df

    def recommend(self, user_id, n_recommendations=5):
        if not self.fetch_data():
            return []
        
        self.prepare_features()
        
        user_profile_df = self.get_user_profile(user_id)
        
        if user_profile_df is None:
            # Cold start: Recommend popular or flash sale products
            recommendations = self.products_df.sort_values(by=['is_flash_sale', 'avg_rating'], ascending=False).head(n_recommendations)
        else:
            distances, indices = self.model.kneighbors(user_profile_df, n_neighbors=n_recommendations + 5)
            # Filter out products user already bought?
            # For now, just return top N
            recommendations = self.products_df.iloc[indices[0]]
            
        # Format the output
        result = []
        for _, row in recommendations.iterrows():
            result.append({
                "productId": str(row['_id']),
                "productName": row['productName'],
                "category": row['category'],
                "price": row['sellingPrice'],
                "discount": row['discount'],
                "image": row['images'][0] if row['images'] and len(row['images']) > 0 else None,
                "isFlashSale": bool(row['is_flash_sale']),
                "hasCoupon": bool(row['has_coupon']),
                "rating": row['avg_rating']
            })
            
        return result[:n_recommendations]
