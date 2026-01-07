import requests
import json

def test_chat():
    # url = "http://localhost:5010/chat"
    url = "http://127.0.0.1:5011/chat" # Force IPv4, Port 5011
    
    # Test Order Query
    payload_order = {
        "message": "Where is my order?",
        "userId": "WjGtUbCr3UQtrV8J4U9mEHR3kB43"
    }
    try:
        print("Testing Order Query...")
        res = requests.post(url, json=payload_order)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
    except Exception as e:
        print(f"Order Test Failed: {e}")

    # Test Product Query
    payload_product = {
        "message": "price of chicken",
        "userId": "WjGtUbCr3UQtrV8J4U9mEHR3kB43"
    }
    try:
        print("\nTesting Product Query...")
        res = requests.post(url, json=payload_product)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
    except Exception as e:
        print(f"Product Test Failed: {e}")

    # Test List All Orders
    payload_list = {
        "message": "List all my orders",
        "userId": "WjGtUbCr3UQtrV8J4U9mEHR3kB43"
    }
    try:
        print("\nTesting List All Orders Query...")
        res = requests.post(url, json=payload_list)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
    except Exception as e:
        print(f"List Orders Test Failed: {e}")

    # Test JBL Product Query (User reported issue)
    payload_jbl = {
        "message": "is there any jbl product",
        "userId": "WjGtUbCr3UQtrV8J4U9mEHR3kB43"
    }
    try:
        print("\nTesting JBL Product Query...")
        res = requests.post(url, json=payload_jbl)
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
    except Exception as e:
        print(f"JBL Test Failed: {e}")

if __name__ == "__main__":
    test_chat()
