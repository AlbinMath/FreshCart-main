import React, { useEffect, useState } from 'react';
import Navbar from '../navbar/Navbar';
import apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Orders() {
    const { currentUser } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

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
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
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
                ) : (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <div key={order._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <p className="font-bold text-gray-800">Order #{order.razorpayOrderId || order._id.slice(-6).toUpperCase()}</p>
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
                                <div className="mt-4 flex justify-end">
                                    <Link
                                        to={`/order-success/${order._id}`}
                                        className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1"
                                    >
                                        View Details
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
