"""
handlers/review.py
------------------
Handlers for review-related queries.
"""

from config.database import reviews_collection, products_collection

def get_product_reviews(product_name):
    """Get reviews for a specific product or all recent reviews"""
    try:
        print(f"⭐ Searching reviews for: '{product_name}'")
        
        # If no specific product, show all recent reviews
        if not product_name or product_name.strip() == '':
            print("📋 No specific product, showing all recent reviews")
            reviews = list(reviews_collection.find(
                {},
                {
                    'userId': 1,
                    'productRate': 1,
                    'qualityRate': 1,
                    'overallRate': 1,
                    'deliveryRate': 1,
                    'reviewText': 1,
                    'likeFeatures': 1,
                    'deliveryReview': 1,
                    'createdAt': 1
                }
            ).sort('createdAt', -1).limit(5))
            
            if reviews:
                avg_rating = sum(r.get('overallRate', 0) for r in reviews if r.get('overallRate')) / max(len([r for r in reviews if r.get('overallRate')]), 1)
                return {
                    'productName': 'Recent Customer Reviews',
                    'reviews': reviews,
                    'averageRating': round(avg_rating, 1),
                    'reviewCount': len(reviews)
                }
            return None
        
        # First, find the product to get its ID
        product = products_collection.find_one(
            {'productName': {'$regex': product_name, '$options': 'i'}},
            {'_id': 1, 'productName': 1}
        )
        
        # Get all reviews
        reviews = list(reviews_collection.find(
            {},
            {
                'userId': 1,
                'productRate': 1,
                'qualityRate': 1,
                'overallRate': 1,
                'deliveryRate': 1,
                'reviewText': 1,
                'likeFeatures': 1,
                'deliveryReview': 1,
                'createdAt': 1
            }
        ).sort('createdAt', -1).limit(5))
        
        print(f"📊 Found {len(reviews)} reviews in database")
        
        if reviews:
            avg_rating = sum(r.get('overallRate', 0) for r in reviews if r.get('overallRate')) / max(len([r for r in reviews if r.get('overallRate')]), 1)
            return {
                'productName': product['productName'] if product else 'FreshCart Products',
                'reviews': reviews,
                'averageRating': round(avg_rating, 1),
                'reviewCount': len(reviews)
            }
        return None
    except Exception as e:
        print(f"❌ Error fetching reviews: {e}")
        return None
