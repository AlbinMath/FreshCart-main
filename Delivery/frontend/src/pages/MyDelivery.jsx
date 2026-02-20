
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Package, CheckCircle, Clock, MapPin, Calendar, ChevronRight, Navigation, Truck } from 'lucide-react';
import OrderDetailsDialog from '../components/OrderDetailsDialog';
import DeliveryCompletionDialog from '../components/DeliveryCompletionDialog';
import LoadingScreen from '../components/LoadingScreen';

const MyDelivery = () => {
    const [currentDeliveries, setCurrentDeliveries] = useState([]); // Changed to array
    const [selectedOrder, setSelectedOrder] = useState(null); // For Dialog
    const [todayStats, setTodayStats] = useState({ assigned: 0, completed: 0 });
    const [history, setHistory] = useState([]);
    const navigate = useNavigate();

    const [nearestOrder, setNearestOrder] = useState(null);
    const [loadingNearest, setLoadingNearest] = useState(false);
    const [locationError, setLocationError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [timer, setTimer] = useState(180); // 3 minutes in seconds
    const [isDialogOpen, setIsDialogOpen] = useState(false); // Dialog State
    const [pageLoading, setPageLoading] = useState(false); // Global page loading state

    // ... (existing code)

    useEffect(() => {
        const loadData = async () => {
            if (agentId) {
                try {
                    // setPageLoading(true); // Removed blocking loading
                    await Promise.all([
                        fetchCurrentDeliveries(),
                        fetchTodayStats(),
                        fetchHistory()
                    ]);
                    fetchNearestOrder();
                } catch (err) {
                    console.error("Error loading initial data:", err);
                } finally {
                    setPageLoading(false);
                }
            } else {
                setPageLoading(false);
            }
        };

        loadData();

        // Polling interval for real-time updates (1s)
        const intervalId = setInterval(() => {
            if (agentId) {
                fetchCurrentDeliveries();
                fetchNearestOrder();
                fetchTodayStats();
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [agentId]);

    // Clear nearest order if we have a current delivery
    // Note: With multiple orders, we might still want to see nearest if we can handle more?
    // User requirement: "Enable Multiple Active Orders".
    // For now, let's allow fetching nearest even if we have orders, 
    // unless there's a specific business rule against it.
    // The previous logic cleared it if `currentDelivery` existed.
    // We will relax this so they can pick up more.

    // Timer Effect
    useEffect(() => {
        let interval;
        if (nearestOrder && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0 && nearestOrder) {
            // Auto Accept on Timeout
            handleAcceptOrder(nearestOrder._id);
        }
        return () => clearInterval(interval);
    }, [nearestOrder, timer]);

    const fetchTodayStats = async () => {
        if (!agentId) return;
        try {
            const response = await axios.get(`http://localhost:5007/api/delivery-agent/stats/${agentId}`);
            if (response.data) {
                setTodayStats(response.data);
            }
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    };

    const fetchHistory = async () => {
        if (!agentId) return;
        try {
            const response = await axios.get(`http://localhost:5007/api/delivery-agent/history/${agentId}`);
            if (response.data && Array.isArray(response.data)) {
                setHistory(response.data.slice(0, 10)); // Top 10 only
            }
        } catch (err) {
            console.error("Error fetching history:", err);
        }
    };

    const fetchCurrentDeliveries = async () => {
        if (!agentId) return;
        try {
            const response = await axios.get(`http://localhost:5007/api/delivery-agent/current-delivery/${agentId}`);
            if (response.data && Array.isArray(response.data)) {
                setCurrentDeliveries(response.data);
            } else {
                setCurrentDeliveries([]);
            }
        } catch (err) {
            console.error("Error fetching current delivery:", err);
            setCurrentDeliveries([]);
        }
    };

    const fetchNearestOrder = () => {
        if (!agentId || currentDeliveries.length >= 5) return;

        setLoadingNearest(true);
        setLocationError(null);

        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            setLoadingNearest(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const response = await axios.post('http://localhost:5007/api/delivery-agent/nearest-shop-order', {
                        latitude,
                        longitude,
                        agentId
                    });

                    if (response.data && response.data.message !== 'No active orders found') {
                        setNearestOrder(response.data);
                        setTimer(180); // Reset timer for new order
                    } else {
                        setNearestOrder(null);
                    }
                } catch (err) {
                    console.error("Error fetching nearest order:", err);
                    setLocationError("Failed to fetch nearest order");
                } finally {
                    setLoadingNearest(false);
                }
            },
            (error) => {
                console.error("Error getting location:", error);
                setLocationError("Unable to retrieve your location");
                setLoadingNearest(false);
            }
        );
    };

    const handleAcceptOrder = async (orderId) => {
        try {
            setActionLoading(true);
            await axios.put('http://localhost:5007/api/delivery-agent/accept-order', {
                orderId,
                agentId
            });

            setNearestOrder(null); // Remove from nearest
            fetchCurrentDeliveries(); // Move to current list
            fetchTodayStats(); // Update stats

            // Optionally try to fetch another nearest order immediately
            setTimeout(fetchNearestOrder, 1000);

        } catch (err) {
            console.error("Error accepting order:", err);
            alert("Failed to accept order");
        } finally {
            setActionLoading(false);
        }
    };

    const handleRejectOrder = async (orderId) => {
        try {
            setActionLoading(true);
            await axios.put('http://localhost:5007/api/delivery-agent/reject-order', {
                orderId,
                agentId
            });
            setNearestOrder(null);
            fetchNearestOrder(); // Find next one
        } catch (err) {
            console.error("Error rejecting order:", err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCompleteOrder = (order) => {
        setSelectedCompletionOrder(order);
        setShowCompletionDialog(true);
    };

    const handleTrackOrder = (e, delivery) => {
        e.stopPropagation();
        // Construct query params
        const params = new URLSearchParams();
        if (delivery.shippingAddress) {
            // If we have coordinates (future proofing), use them. 
            // For now, let's rely on address or whatever we have.
            // If the delivery object has lat/lng for destination, use it. 
            // Currently backend might not send it, so we fallback to address.

            // Assuming shippingAddress might be a string or object. 
            // Based on backend route 'current-delivery', it tries to normalize it to an object with fullName, etc.
            // But if it was originally just an object in DB without lat/lng, we might only have address text.

            // Let's check what we usually have. 
            // If shippingAddress is an object with 'street', 'city', etc. join them.
            let addressStr = "";
            if (typeof delivery.shippingAddress === 'string') {
                addressStr = delivery.shippingAddress;
            } else if (delivery.shippingAddress) {
                addressStr = `${delivery.shippingAddress.street || ''} ${delivery.shippingAddress.city || ''} ${delivery.shippingAddress.state || ''} ${delivery.shippingAddress.zipCode || ''}`.trim();
                // If that failed (e.g. structure is different), try mapped fallback
                if (!addressStr && delivery.shippingAddress.address) addressStr = delivery.shippingAddress.address;
            }

            if (addressStr) params.append('address', addressStr);

            // If backend provided coordinates for the user (not currently in schema but good to have)
            if (delivery.shippingAddress.latitude && delivery.shippingAddress.longitude) {
                params.append('lat', delivery.shippingAddress.latitude);
                params.append('lng', delivery.shippingAddress.longitude);
            }
        }

        // Pass orderId too just in case
        params.append('orderId', delivery._id);

        // Navigate
        navigate(`/tracking?${params.toString()}`);
    };

    const openOrderDetails = (order) => {
        setSelectedOrder(order);
        setIsDialogOpen(true);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (pageLoading) {
        return <LoadingScreen text="Loading your dashboard..." />;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">
                My Deliveries
                <span className="text-xs text-gray-400 font-mono ml-4">ID: {agentId}</span>
            </h1>

            {/* 1. Current Running Status */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Clock className="text-blue-600" size={20} />
                    Current Status
                </h2>

                {currentDeliveries.length > 0 ? (
                    <div className="space-y-4">
                        {currentDeliveries.map((delivery) => (
                            <div
                                key={delivery._id}
                                onClick={() => openOrderDetails(delivery)}
                                className="border border-green-100 bg-green-50 p-4 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-800">Order #{delivery._id.substring(0, 8)}...</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {delivery.shopAddress ? delivery.shopAddress : 'Location available'}
                                        </p>
                                    </div>
                                    <span className="bg-green-600 text-white text-xs px-2 py-1 rounded font-medium">
                                        {delivery.status}
                                    </span>
                                </div>

                                <div className="flex gap-2 mt-4 pt-3 border-t border-green-200">
                                    <button
                                        onClick={(e) => handleTrackOrder(e, delivery)}
                                        className="flex-1 bg-white border border-blue-500 text-blue-600 text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <MapPin size={16} />
                                        Track Location
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCompleteOrder(delivery);
                                        }}
                                        disabled={actionLoading}
                                        className="flex-1 bg-green-600 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                                    >
                                        <CheckCircle size={16} />
                                        Complete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Package className="text-gray-400" size={24} />
                        </div>
                        <p className="font-medium">No active delivery</p>
                        <p className="text-sm mt-1 text-gray-400">You are currently available for new assignments.</p>
                    </div>
                )}
            </div>

            {/* Nearest Shop Order Section */}
            {/* Show only if limit not reached */}
            {currentDeliveries.length < 5 ? (
                <>
                    {nearestOrder && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <Navigation className="text-orange-600" size={20} />
                                Nearest Shop Order
                            </h2>

                            {loadingNearest ? (
                                <div className="text-gray-500 text-sm">Finding nearest order...</div>
                            ) : locationError ? (
                                <div className="text-red-500 text-sm">{locationError}</div>
                            ) : (
                                <div className="border border-orange-100 bg-orange-50 p-4 rounded-lg">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-gray-800">{nearestOrder.shopName}</h3>
                                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                <MapPin size={14} />
                                                {nearestOrder.shopAddress}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Distance: <span className="font-medium text-gray-800">{nearestOrder.distance} km</span> away
                                            </p>
                                        </div>
                                        <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded font-medium">
                                            Ready for Pickup
                                        </span>
                                    </div>

                                    <div className="border-t border-orange-200 my-3 pt-3">
                                        <p className="text-sm font-medium text-gray-700">Order #{nearestOrder._id.substring(0, 8)}...</p>
                                        <p className="text-xs text-gray-500 mt-1">Items: {nearestOrder.items?.length || 0}</p>
                                    </div>

                                    <div className="flex gap-3 justify-between">
                                        <button
                                            onClick={() => handleRejectOrder(nearestOrder._id)}
                                            disabled={actionLoading}
                                            className="flex-1 bg-white border border-red-500 text-red-600 hover:bg-red-50 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => handleAcceptOrder(nearestOrder._id)}
                                            disabled={actionLoading}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
                                        >
                                            {actionLoading ? 'Accepting...' : `Accept (${formatTime(timer)})`}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {!nearestOrder && loadingNearest && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="text-gray-500 text-sm">Finding nearby orders...</div>
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-yellow-50 p-6 rounded-xl shadow-sm border border-yellow-100 text-center">
                    <div className="text-yellow-800 font-medium">Maximum Active Orders Reached</div>
                    <p className="text-sm text-yellow-600 mt-1">You have 5 active deliveries. Please complete some orders to accept new ones.</p>
                </div>
            )}


            {/* 2. Today's Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <div className="text-gray-500 text-sm font-medium">Assigned Today</div>
                        <div className="text-2xl font-bold text-gray-800 mt-1">{todayStats.assigned}</div>
                    </div>
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                        <Package size={20} />
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <div className="text-gray-500 text-sm font-medium">Completed Today</div>
                        <div className="text-2xl font-bold text-gray-800 mt-1">{todayStats.completed}</div>
                    </div>
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                        <CheckCircle size={20} />
                    </div>
                </div>
            </div>

            {/* 3. Previous History Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <Calendar className="text-purple-600" size={20} />
                        Previous History
                    </h2>
                    {history.length > 0 && (
                        <button
                            onClick={() => navigate('/delivery-history')}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            View All
                        </button>
                    )}
                </div>

                {history.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {history.map((item, index) => (
                            <div
                                key={index}
                                onClick={() => openOrderDetails(item)}
                                className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-800">Order #{item._id ? item._id.substring(0, 8) : 'N/A'}...</div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(item.updatedAt).toLocaleDateString()} • {item.shippingAddress?.city || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-green-600 font-medium text-sm">₹{item.totalAmount}</span>
                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-500">
                        <div className="inline-block p-4 bg-gray-50 rounded-full mb-3">
                            <Clock className="text-gray-300" size={32} />
                        </div>
                        <p>No delivery history found.</p>
                    </div>
                )}
            </div>

            {/* Order Details Dialog */}
            <OrderDetailsDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                order={selectedOrder}
            />

            {/* OTP Completion Dialog */}
            <DeliveryCompletionDialog
                isOpen={showCompletionDialog}
                onClose={() => setShowCompletionDialog(false)}
                order={selectedCompletionOrder}
                onCompleteSuccess={() => {
                    fetchCurrentDeliveries();
                    fetchTodayStats();
                    fetchHistory();
                }}
            />
        </div>
    );
};

export default MyDelivery;
