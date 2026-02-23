"""
utils/helpers.py
----------------
Utility functions for text processing and data extraction.
"""

import re

def extract_product_name(message):
    """Clean the message and extract only the potential product/item name."""
    # Common words to remove for better matching
    product_keywords = [
        'price of', 'show', 'find', 'buy', 'want', 'looking for', 'search',
        'cost of', 'details of', 'tell me about', 'order', 'add', 'to cart',
        'in cart', 'available', 'stock', 'please', 'can you', 'give me',
        'chicken', 'mutton', 'fish', 'onion', 'tomato', 'potato', 'milk',
        'curd', 'paneer', 'mango', 'apple', 'banana'
    ]
    
    # We want to keep the food items but remove the filler verbs
    stop_words = [
        'show', 'find', 'buy', 'want', 'looking', 'for', 'search', 'cost',
        'of', 'details', 'tell', 'me', 'about', 'order', 'add', 'to', 'in',
        'cart', 'available', 'stock', 'please', 'can', 'you', 'give', 'is',
        'are', 'the', 'a', 'an', 'some', 'price', 'any'
    ]
    
    words = message.lower().split()
    product_words = [w for w in words if w not in stop_words]
    result = ' '.join(product_words).strip()
    
    # Remove special characters
    result = re.sub(r'[^\w\s]', '', result)
    
    print(f"🔍 Extracted product name: '{result}' from message: '{message}'")
    return result if result else message
