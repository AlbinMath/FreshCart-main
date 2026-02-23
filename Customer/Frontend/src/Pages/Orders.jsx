import React, { useEffect, useState } from 'react';
import apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import DeliveryEstimate from '../components/DeliveryEstimate';

export default function Orders() {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Optional: you could use a toast here instead of alert for better UX, but keeping it simple as requested
        alert(`Copied: ${text}`);
    };

    const filteredOrders = orders.filter(order => {
        const idToCheck = order.orderId || order.razorpayOrderId || order._id;
        return idToCheck.toLowerCase().includes(searchTerm.toLowerCase());
    });

    useEffect(() => {
        if (currentUser) {
            fetchOrders();
        }
    }, [currentUser]);

    const fetchOrders = async () => {
        try {
            const response = await apiService.get(`/payment/user-orders/${currentUser.uid}`);
            if (response.success) {
                setOrders(response.orders);
            }
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans">

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Search Order ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <Link to="/" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Shopping
                    </Link>
                </div>

                {orders.length === 0 ? (
                    <div className="bg-white p-8 rounded-lg shadow-md text-center">
                        <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
                        <Link to="/" className="text-green-600 font-medium hover:underline">Start Shopping</Link>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No orders found matching "{searchTerm}"
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map(order => {
                            const displayId = order.orderId || order.razorpayOrderId || order._id.slice(-6).toUpperCase();

                            return (
                                <div key={order._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-800">Order #{displayId}</p>
                                                <button
                                                    onClick={() => copyToClipboard(displayId)}
                                                    className="text-gray-400 hover:text-gray-600"
                                                    title="Copy Order ID"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                                            <p className="text-sm text-gray-500">{order.items.length} Items</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <p className="font-bold text-lg text-green-600">
                                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(order.totalAmount)}
                                            </p>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium mt-2 ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* ✅ Delivery Estimate – only for active orders */}
                                    {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                                        <div className="mt-4 border-t pt-4">
                                            <DeliveryEstimate
                                                storeAddress={(order.items?.[0] || {}).storeAddress || null}
                                                prepMins={parseFloat((order.items?.[0] || {}).preparationTime) || 0}
                                                savedAddress={order.shippingAddress}
                                            />
                                        </div>
                                    )}

                                    {/* Products in Order */}
                                    <div className="mt-4 border-t pt-4">
                                        <p className="text-sm font-semibold text-gray-700 mb-2">Items:</p>
                                        <div className="flex flex-wrap gap-4">
                                            {order.items.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border">
                                                    <img
                                                        src={item.image || (item.images && item.images[0])}
                                                        alt={item.productName}
                                                        className="h-12 w-12 object-cover rounded"
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-medium text-gray-800 line-clamp-1 w-32">{item.productName}</span>
                                                        <span className="text-[10px] text-gray-500">{item.quantity} x ₹{item.sellingPrice}</span>
                                                        {order.status === 'Delivered' && (
                                                            <Link
                                                                to={`/rate-product/${order._id}/${item.productId || item._id}`}
                                                                className="text-xs text-yellow-600 hover:underline font-bold mt-1"
                                                            >
                                                                Rate Product ★
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-end gap-3">
                                        <Link
                                            to={`/order-success/${order._id}`}
                                            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1 border border-green-600 px-3 py-1 rounded transition hover:bg-green-50"
                                        >
                                            View Details
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
