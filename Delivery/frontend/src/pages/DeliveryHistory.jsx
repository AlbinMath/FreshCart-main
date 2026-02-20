import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Calendar, MapPin, IndianRupee, ArrowLeft, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OrderDetailsDialog from '../components/OrderDetailsDialog';
import LoadingScreen from '../components/LoadingScreen';

const DeliveryHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const navigate = useNavigate();

    // Mock Agent ID (Replace with real auth)
    const getAgentId = () => {
        const storedAgent = localStorage.getItem('agent');
        return storedAgent ? JSON.parse(storedAgent).id : null;
    };
    const agentId = getAgentId();

    useEffect(() => {
        if (agentId) {
            fetchHistory();
        }
    }, [agentId]);

    const fetchHistory = async () => {
        try {
            const response = await axios.get(`http://localhost:5007/api/delivery-agent/history/${agentId}`);
            if (response.data && Array.isArray(response.data)) {
                setHistory(response.data);
            }
        } catch (err) {
            console.error("Error fetching history:", err);
        } finally {
            setLoading(false);
        }
    };

    const openOrderDetails = (order) => {
        setSelectedOrder(order);
        setIsDialogOpen(true);
    };

    const filteredHistory = history.filter(order =>
        order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.shippingAddress?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <LoadingScreen text="Loading history..." />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Delivery History</h1>
            </div>

            {/* Search & Stats */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Order ID or Customer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                </div>
                <div className="text-sm text-gray-500 font-medium">
                    Total Delivered: <span className="text-gray-800 font-bold">{history.length}</span>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading history...</div>
                ) : filteredHistory.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {filteredHistory.map((order) => (
                            <div
                                key={order._id}
                                onClick={() => openOrderDetails(order)}
                                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800 flex items-center gap-2">
                                            Order #{order._id.substring(0, 8)}...
                                            <span className="text-xs font-normal text-gray-400 px-2 py-0.5 bg-gray-100 rounded-full">Delivered</span>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                            <Calendar size={12} />
                                            {new Date(order.updatedAt).toLocaleDateString()} at {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1 flex items-start gap-1">
                                            <MapPin size={12} className="mt-0.5 shrink-0" />
                                            <span className="line-clamp-1">{order.shippingAddress?.fullName} - {order.shippingAddress?.city}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                                    <div className="font-bold text-gray-800 text-lg flex items-center">
                                        <IndianRupee size={16} className="mt-0.5" />
                                        {order.totalAmount}
                                    </div>
                                    <div className="text-blue-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                                        View Details
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-500">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p>No delivery history found.</p>
                    </div>
                )}
            </div>

            <OrderDetailsDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                order={selectedOrder}
            />
        </div>
    );
};

export default DeliveryHistory;
