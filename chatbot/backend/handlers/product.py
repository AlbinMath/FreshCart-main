"""
handlers/product.py
-------------------
Handlers for product-related queries: search, compare, price range, deals, and categories.
"""

import re
from fuzzywuzzy import fuzz
from config.database import products_collection, PRODUCT_QUERY
from algorithms.sets import SET_FOOD_ITEMS, FOOD_SYNONYMS

def search_products(query, limit=3):
    """Search for products using fuzzy matching"""
    try:
        # Get all available products (Approved OR no status set)
        all_products = list(products_collection.find(
            PRODUCT_QUERY,
            {
                '_id': 1,
                'productName': 1,
                'sellingPrice': 1,
                'images': 1,
                'category': 1,
                'description': 1,
                'unit': 1,
                'stockQuantity': 1,
                'sellerName': 1,
                'storeName': 1,
                'features': 1,
                'preparationTime': 1,
                'freshnessGuarantee': 1
            }
        ))
        
        # Fuzzy match products
        scored_products = []
        for product in all_products:
            score = fuzz.partial_ratio(query.lower(), product['productName'].lower())
            # Also check category match
            if product.get('category'):
                category_score = fuzz.partial_ratio(query.lower(), product['category'].lower())
                score = max(score, category_score)
            
            if score > 50:  # Threshold for relevance
                scored_products.append((score, product))
        
        # Sort by score and return top results
        scored_products.sort(reverse=True, key=lambda x: x[0])
        return [p[1] for p in scored_products[:limit]]
    except Exception as e:
        print(f"Error searching products: {e}")
        return []

def compare_products(name1, name2):
    """Compare two products side-by-side using set-based field analysis"""
    try:
        p1_list = search_products(name1, limit=1)
        p2_list = search_products(name2, limit=1)
        if not p1_list or not p2_list:
            return None
        p1, p2 = p1_list[0], p2_list[0]

        # Use sets to find shared and unique features
        f1 = set(p1.get('features', []) or [])
        f2 = set(p2.get('features', []) or [])
        shared_features   = f1 & f2   # intersection
        unique_to_p1      = f1 - f2   # difference
        unique_to_p2      = f2 - f1   # difference

        return {
            'product1': p1, 'product2': p2,
            'shared_features': list(shared_features),
            'unique_p1': list(unique_to_p1),
            'unique_p2': list(unique_to_p2),
            'cheaper': p1['productName'] if p1.get('sellingPrice',0) <= p2.get('sellingPrice',0) else p2['productName']
        }
    except Exception as e:
        print(f"Error comparing products: {e}")
        return None

def get_products_by_price_range(min_price=None, max_price=None, keyword=None, limit=5):
    """Filter products by price range using MongoDB + set keyword expansion"""
    try:
        query = dict(PRODUCT_QUERY)
        price_filter = {}
        if min_price is not None:
            price_filter['$gte'] = min_price
        if max_price is not None:
            price_filter['$lte'] = max_price
        if price_filter:
            query['sellingPrice'] = price_filter

        # Expand keyword using set union with food synonyms
        if keyword:
            kw_lower = keyword.lower()
            search_terms = FOOD_SYNONYMS.get(kw_lower, {kw_lower})
            pattern = '|'.join(re.escape(t) for t in search_terms)
            query['$or'] = [
                {'productName': {'$regex': pattern, '$options': 'i'}},
                {'category': {'$regex': pattern, '$options': 'i'}}
            ]

        products = list(products_collection.find(
            query,
            {'productName':1,'sellingPrice':1,'category':1,'unit':1,'stockQuantity':1,'images':1,'_id':1}
        ).sort('sellingPrice', 1).limit(limit))
        return products
    except Exception as e:
        print(f"Error filtering by price: {e}")
        return []

def get_best_deals(limit=5):
    """Get best deals: lowest price per unit from approved products"""
    try:
        deals_query = {**PRODUCT_QUERY, 'stockQuantity': {'$gt': 0}}
        products = list(products_collection.find(
            deals_query,
            {'productName':1,'sellingPrice':1,'category':1,'unit':1,'stockQuantity':1,'images':1,'_id':1}
        ).sort('sellingPrice', 1).limit(limit))
        return products
    except Exception as e:
        print(f"Error getting best deals: {e}")
        return []

def get_categories_list():
    """Get all product categories using MongoDB distinct (set-like unique values)"""
    try:
        categories = products_collection.distinct('category', PRODUCT_QUERY)
        category_counts = {}
        for cat in categories:
            count = products_collection.count_documents({**PRODUCT_QUERY, 'category': cat})
            category_counts[cat] = count
        return category_counts
    except Exception as e:
        print(f"Error getting categories: {e}")
        return {}

def get_all_products(page=1, per_page=5):
    """Get all products with pagination"""
    try:
        skip = (page - 1) * per_page
        total_count = products_collection.count_documents(PRODUCT_QUERY)
        
        products = list(products_collection.find(
            PRODUCT_QUERY,
            {
                'productName': 1,
                'sellingPrice': 1,
                'category': 1,
                'unit': 1,
                'stockQuantity': 1,
                'description': 1
            }
        ).sort('productName', 1).skip(skip).limit(per_page))
        
        total_pages = (total_count + per_page - 1) // per_page
        has_next = page < total_pages
        
        return {
            'products': products,
            'page': page,
            'per_page': per_page,
            'total': total_count,
            'total_pages': total_pages,
            'has_next': has_next
        }
    except Exception as e:
        print(f"Error getting all products: {e}")
        return None

def get_product_showcase():
    """Get product categories with sample products for customer showcase"""
    try:
        categories = products_collection.distinct('category', PRODUCT_QUERY)
        
        popular_products = list(products_collection.find(
            PRODUCT_QUERY,
            {
                'productName': 1,
                'sellingPrice': 1,
                'category': 1,
                'unit': 1,
                'stockQuantity': 1
            }
        ).sort('orderCount', -1).limit(6))
        
        category_products = {}
        for cat in categories[:5]:
            query_cat = {**PRODUCT_QUERY, 'category': cat}
            products = list(products_collection.find(
                query_cat,
                {'productName': 1, 'sellingPrice': 1, 'unit': 1}
            ).limit(3))
            if products:
                category_products[cat] = products
        
        return {
            'categories': categories,
            'popular': popular_products,
            'byCategory': category_products
        }
    except Exception as e:
        print(f"Error getting product showcase: {e}")
        return None
