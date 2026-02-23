"""
handlers/support.py
-------------------
Handlers for customer support, reports, notifications, tax, and policies.
"""

from config.database import reports_collection, notifications_collection, customer_collection
import datetime
import uuid

def create_report(user_id, description, issue_type='Other'):
    """Create a new report in the Announcements database"""
    try:
        # Fetch user details for the report
        user = customer_collection.find_one({'uid': user_id})
        if not user:
            return None, "User not found"

        report_id = f"CHAT-{str(uuid.uuid4())[:8].upper()}"
        
        new_report = {
            'userId': user_id,
            'reportId': report_id,
            'userEmail': user.get('email', 'N/A'),
            'userName': user.get('name', 'N/A'),
            'issueType': issue_type,
            'orderId': None,
            'description': description,
            'status': 'Pending',
            'createdAt': datetime.datetime.utcnow()
        }
        
        reports_collection.insert_one(new_report)
        return report_id, None
    except Exception as e:
        print(f"❌ Error creating report: {e}")
        return None, str(e)

def get_user_reports(user_id):
    """Get reports filed by the user"""
    try:
        # In Report.js, field is 'userId'
        reports = list(reports_collection.find({'userId': user_id}).sort('createdAt', -1).limit(5))
        return reports
    except Exception as e:
        print(f"❌ Error fetching reports: {e}")
        return []

def get_seller_notifications(seller_id):
    """Get notifications for a seller (low stock, etc)"""
    try:
        # In Notification.js, field is 'sellerId'
        notifs = list(notifications_collection.find({'sellerId': seller_id, 'isRead': False}).sort('createdAt', -1).limit(5))
        return notifs
    except Exception as e:
        print(f"❌ Error fetching notifications: {e}")
        return []

def get_policy_info(policy_type):
    """Return static info about platform policies"""
    policies = {
        'refund': "💰 **Refund Policy**\nRefunds are processed within 5-7 business days after the request is approved. You can file a refund issue via the 'Reports' section.",
        'return': "📦 **Return Policy**\nFresh items can be returned within 24 hours of delivery if they are damaged or incorrect. Non-perishables have a 7-day return window.",
        'cancellation': "❌ **Cancellation Policy**\nOrders can be cancelled before they are out for delivery. Once out for delivery, cancellations are not permitted.",
        'general': "📋 **FreshCart Policies**\nWe guarantee 100% freshness. For any issues, please use the 'Report' feature or contact support."
    }
    return policies.get(policy_type, policies['general'])

def get_tax_info():
    """Return general tax information"""
    return "🧾 **Tax Information**\nAll prices shown are inclusive of GST. Tax rates vary by category (e.g., 5% for most groceries). You can see the exact tax breakdown in your order receipts."
