import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Power, MapPin, Phone, Navigation, Package, DollarSign, Star, Clock, Calendar, CheckCircle, Navigation2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ScheduleModal from '../components/ScheduleModal';
import LoadingScreen from '../components/LoadingScreen';

const Dashboard = () => {
    const navigate = useNavigate();
    // State
    const [isOnline, setIsOnline] = useState(false); // Default offline until we verify schedule or user toggles
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [activeSlot, setActiveSlot] = useState(null); // The current valid time slot string if any
    const [scheduleLoaded, setScheduleLoaded] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Get Agent Info
    const agentData = JSON.parse(localStorage.getItem('agent') || '{}');
    const agentId = agentData.id;

    // 1. Fetch Schedule & Check Time
    useEffect(() => {
        const checkSchedule = async (isInitial = false) => {
            if (!agentId) return;
            try {
                let currentOnlineState = isOnline;
                // Fetch agent actual status if this is the initial load
                if (isInitial) {
                    try {
                        const profileRes = await axios.get(`${import.meta.env.VITE_API_URL}/profile/${agentId}`);
                        currentOnlineState = profileRes.data.isOnline;
                        setIsOnline(currentOnlineState);
                    } catch (err) {
                        console.error("Error fetching agent profile:", err);
                    }
                }

                const today = new Date().toISOString().split('T')[0];
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/schedule/${agentId}`);

                // Find today's schedule
                const todaySchedule = response.data.find(s => s.date === today);

                if (todaySchedule && todaySchedule.slots.length > 0) {
                    const now = new Date();
                    const currentMinutes = now.getHours() * 60 + now.getMinutes();

                    // Logic: "10:00 AM - 12:00 PM"
                    const slotFound = todaySchedule.slots.find(slot => {
                        let parts = slot.split(' – ');
                        if (parts.length < 2) parts = slot.split(' - ');
                        if (parts.length < 2) return false;

                        const [startStr, endStr] = parts;

                        const parseMinutes = (tStr) => {
                            if (!tStr) return -1;
                            const [time, modifier] = tStr.trim().split(' ');
                            let [hours, minutes] = time.split(':');
                            if (hours === '12') hours = '00';
                            let h = parseInt(hours, 10);
                            if (modifier === 'PM' && h !== 12) h += 12;
                            if (modifier === 'AM' && h === 12) h = 0;
                            return h * 60 + parseInt(minutes, 10);
                        };

                        const startM = parseMinutes(startStr);
                        const endM = parseMinutes(endStr);

                        return currentMinutes >= startM && currentMinutes < endM;
                    });

                    setActiveSlot(slotFound || null);

                    if (!slotFound && currentOnlineState) {
                        // Force offline via API if slot ended
                        handlePowerToggle(false);
                    }
                } else {
                    setActiveSlot(null);
                    if (currentOnlineState) handlePowerToggle(false);
                }
            } catch (err) {
                console.error("Error fetching schedule:", err);
            } finally {
                setScheduleLoaded(true);
            }
        };

        checkSchedule(true);
        const interval = setInterval(() => checkSchedule(false), 60000); // Check every minute
        return () => clearInterval(interval);
    }, [agentId, isOnline, refreshTrigger]);

    // 2. Force Location Update (Tracking)
    useEffect(() => {
        let watchId;
        if (isOnline) {
            if ("geolocation" in navigator) {
                watchId = navigator.geolocation.watchPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        setUserLocation({ lat: latitude, lng: longitude });
                        // console.log(`Force Location Update: ${latitude}, ${longitude}`);
                    },
                    (error) => console.error("Location Error:", error),
                    { enableHighAccuracy: true }
                );
            } else {
                toast.error("Geolocation is required to go online.");
                setIsOnline(false);
            }
        }
        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [isOnline]);

    const handlePowerToggle = async (forceState = null) => {
        const newState = forceState !== null ? forceState : !isOnline;

        if (newState === true && !activeSlot) {
            toast.error("You can only start your shift within your scheduled slot.");
            return;
        }

        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/status/${agentId}`, { isOnline: newState });
            setIsOnline(newState);
            if (newState === false && forceState !== null) toast.success("Shift Ended. You are now offline.");
        } catch (err) {
            console.error("Error updating status:", err);
            if (forceState === null) toast.error("Failed to change status.");
        }
    };

    const [realStats, setRealStats] = useState({ assigned: 0, completed: 0, averageRating: "0.0", onlineMins: 0, todayEarnings: 0 });
    const [currentAssignments, setCurrentAssignments] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!agentId) return;
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/stats/${agentId}`);
                setRealStats(response.data);
            } catch (err) {
                console.error("Error fetching real stats:", err);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, [agentId, isOnline, refreshTrigger]);

    useEffect(() => {
        const fetchCurrentAssignments = async () => {
            if (!agentId) return;
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/current-delivery/${agentId}`);
                if (response.data && Array.isArray(response.data)) {
                    setCurrentAssignments(response.data);
                }
            } catch (err) {
                console.error("Error fetching assignments:", err);
            }
        };

        fetchCurrentAssignments();
        const interval = setInterval(fetchCurrentAssignments, 5000);
        return () => clearInterval(interval);
    }, [agentId]);

    const stats = [
        { label: "Today's Deliveries", value: realStats.completed.toString(), target: "Target: 12", percent: Math.min(Math.round((realStats.completed / 12) * 100), 100), color: "blue", icon: Package },
        { label: "Earnings Today", value: `₹${realStats.todayEarnings || 0}`, change: `+₹${realStats.todayEarnings || 0}`, color: "green", icon: DollarSign },
        { label: "Average Rating", value: realStats.averageRating || "0.0", change: "+0.0", color: "purple", icon: Star },
        { 
            label: "Time Online", 
            value: `${Math.floor((realStats.onlineMins || 0) / 60)}h ${(realStats.onlineMins || 0) % 60}m`, 
            target: "Target: 8h", 
            percent: Math.min(Math.round(((realStats.onlineMins || 0) / 480) * 100), 100), 
            color: "orange", 
            icon: Clock 
        },
    ];

    // if (!scheduleLoaded) {
    //     return <LoadingScreen text="Loading dashboard..." />;
    // }

    return (
        <div className="space-y-6">
            <ScheduleModal
                isOpen={isScheduleOpen}
                onClose={() => setIsScheduleOpen(false)}
                onScheduleUpdate={() => setRefreshTrigger(prev => prev + 1)}
            />

            {/* Top Bar - Status */}
            <div className={`p-4 rounded-xl shadow-sm border flex items-center justify-between transition-colors
                ${isOnline ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'}`}>

                <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full animate-pulse ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <div>
                        <div className="font-bold text-lg text-gray-800">
                            {isOnline ? 'Online & Available' : 'Offline'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                            {activeSlot ? (
                                <span className="text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded">
                                    Current Slot: {activeSlot}
                                </span>
                            ) : (
                                <span>No active schedule</span>
                            )}
                            {isOnline && userLocation && (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                    <MapPin size={10} /> Location Active
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setIsScheduleOpen(true)}
                        className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                    >
                        <Calendar size={16} />
                        Manage Schedule
                    </button>
                    <button
                        onClick={() => handlePowerToggle()}
                        className={`${isOnline ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-md flex items-center gap-2`}
                    >
                        <Power size={18} />
                        {isOnline ? 'Stop Shift' : (activeSlot ? 'Start Shift' : 'Go Online')}
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 transition-transform hover:scale-[1.02]">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="text-gray-500 text-xs font-medium uppercase tracking-wider">{stat.label}</div>
                                <div className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                {stat.label === "Time Online" && isOnline && (
                                    <div className="flex items-center gap-2 mr-1">
                                        <span className="text-[10px] font-bold text-green-500 animate-pulse">LIVE</span>
                                        <span className="flex h-2 w-2 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                    </div>
                                )}
                                <div className={`p-2 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}>
                                    <stat.icon size={20} />
                                </div>
                            </div>
                        </div>

                        {stat.target && (
                            <div>
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>{stat.target}</span>
                                    <span>{stat.percent}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div className={`bg-${stat.color}-500 h-1.5 rounded-full`} style={{ width: `${stat.percent}%` }}></div>
                                </div>
                            </div>
                        )}

                        {stat.change && (
                            <div className="text-xs font-medium text-green-600 flex items-center gap-1">
                                <span>{stat.change}</span>
                                <span className="text-gray-400 font-normal">from yesterday</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Current Assignments */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-800">Current Assignments</h3>
                        {currentAssignments.length > 0 && (
                            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {currentAssignments.length}
                            </span>
                        )}
                    </div>

                    <div className="space-y-4">
                        {currentAssignments.length === 0 ? (
                            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
                                <Package size={48} className="mx-auto mb-3 text-gray-300" />
                                <p>No active assignments.</p>
                                <p className="text-xs mt-1">Go online to receive new orders.</p>
                            </div>
                        ) : (
                            currentAssignments.map((order) => (
                                <div key={order._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-2">
                                            <span className="font-bold text-gray-800">#{order.orderId || order._id.substring(0, 8)}</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <span className="font-bold text-green-600">₹{order.totalAmount}</span>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1"><Package size={16} className="text-gray-400" /></div>
                                            <div>
                                                <div className="text-xs text-gray-400 uppercase">Shop</div>
                                                <div className="text-sm font-medium text-gray-800">{order.shopName || 'Multiple Items'}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1"><MapPin size={16} className="text-gray-400" /></div>
                                            <div>
                                                <div className="text-xs text-gray-400 uppercase">Delivery Address</div>
                                                <div className="text-sm text-gray-600 line-clamp-1">
                                                    {typeof order.shippingAddress === 'string' ? order.shippingAddress : (order.shippingAddress?.address || `${order.shippingAddress?.street}, ${order.shippingAddress?.city}`)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                                        <button 
                                            onClick={() => navigate('/my-delivery')}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
                                        >
                                            <Navigation2 size={16} />
                                            Go to Delivery
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Performance Side Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
                        <h3 className="font-bold text-gray-800 mb-6">Today's Performance</h3>

                        <div className="space-y-6 flex-1">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Deliveries Completed</span>
                                    <span className="font-bold text-gray-800">{realStats.completed}/12</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(Math.round((realStats.completed / 12) * 100), 100)}%` }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">On-Time Delivery Rate</span>
                                    <span className="font-bold text-gray-800">100%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Customer Rating</span>
                                    <span className="font-bold text-gray-800">{realStats.averageRating || "0.0"}/5.0</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(parseFloat(realStats.averageRating) || 0) * 20}%` }}></div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
