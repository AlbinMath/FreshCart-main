import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import {
    ShoppingBag,
    CreditCard,
    Users,
    Package,
    TrendingUp,
    Clock,
    MapPin,
    AlertTriangle,
    Bell
} from 'lucide-react';
import { Badge } from '@/ui/badge';
import { Progress } from '@/ui/progress';
import OperatingHoursDialog from './OperatingHoursDialog';
import NotificationDialog from './NotificationDialog';

// Helper to format hours for display
const formatOperatingHours = (hours) => {
    if (!hours || !Array.isArray(hours) || hours.length === 0) return 'Mon-Sun: 9:00 AM - 8:00 PM';

    // Simple logic: check today's hours
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    const todaySchedule = hours.find(h => h.day === today);

    if (todaySchedule) {
        if (todaySchedule.isClosed) return 'Today: Closed';
        return `Today: ${todaySchedule.open} - ${todaySchedule.close}`;
    }
    return 'Schedule Available';
};

const getStoreStatus = (hours, leave) => {
    if (leave?.isActive) {
        // Date check could be added here
        return { label: 'On Leave', color: 'bg-red-100 text-red-800' };
    }

    if (!hours || !Array.isArray(hours)) return { label: 'Open', color: 'bg-green-100 text-green-800' };

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    const today = days[now.getDay()];
    const todaySchedule = hours.find(h => h.day === today);

    if (!todaySchedule || todaySchedule.isClosed) return { label: 'Closed', color: 'bg-gray-100 text-gray-800' };

    // Time Check
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = todaySchedule.open.split(':').map(Number);
    const [closeH, closeM] = todaySchedule.close.split(':').map(Number);
    const startMinutes = openH * 60 + openM;
    const endMinutes = closeH * 60 + closeM;

    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
        return { label: 'Open Now', color: 'bg-green-100 text-green-800' };
    }
    return { label: 'Closed Now', color: 'bg-gray-100 text-gray-800' };
};

const StoreOverview = () => {
    const [storeInfo, setStoreInfo] = useState(null);
    const [isHoursOpen, setIsHoursOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [performanceData, setPerformanceData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPerformance = async (sellerId) => {
        try {
            // Use port 6002 as configured in the Python service
            const res = await fetch(`http://localhost:6002/evaluate/${sellerId}`);
            if (res.ok) {
                const data = await res.json();
                setPerformanceData(data);
            }
        } catch (error) {
            console.error("Failed to fetch performance evaluation", error);
        }
    };

    const fetchNotifications = async (sellerId) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/notifications/seller/${sellerId}`);
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get store info
                const info = JSON.parse(localStorage.getItem('sellerInfo'));
                const seller = info?.user || info;
                setStoreInfo(seller);

                if (!seller) return;

                // Fetch products
                const uniqueId = seller.sellerUniqueId;
                if (uniqueId) {
                    const productsRes = await fetch(`${import.meta.env.VITE_API_URL}/products/seller/${uniqueId}`);
                    if (productsRes.ok) {
                        const productsData = await productsRes.json();
                        setProducts(productsData);
                    }
                }

                // Fetch orders
                const sellerId = seller._id;
                if (sellerId) {
                    const ordersRes = await fetch(`${import.meta.env.VITE_API_URL}/orders/seller/${sellerId}`);
                    if (ordersRes.ok) {
                        const ordersData = await ordersRes.json();
                        setOrders(ordersData);
                    }

                    // Fetch Notifications
                    fetchNotifications(sellerId);

                    // Fetch Performance Evaluation (SVM)
                    if (seller.sellerUniqueId) {
                        fetchPerformance(seller.sellerUniqueId);
                    } else if (sellerId) {
                        fetchPerformance(sellerId);
                    }
                }
            } catch (e) {
                console.error("Error loading data", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSaveHours = async (updatedData) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/seller/update-profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sellerId: storeInfo._id,
                    ...updatedData
                })
            });

            if (response.ok) {
                const data = await response.json();
                // Update local state and storage
                const newInfo = { ...JSON.parse(localStorage.getItem('sellerInfo')), user: data };
                localStorage.setItem('sellerInfo', JSON.stringify(newInfo));
                setStoreInfo(data);
            } else {
                console.error("Failed to update hours");
            }
        } catch (error) {
            console.error("Error updating hours:", error);
        }
    };

    const handleClearNotification = async (id) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/notifications/${id}/clear`, {
                method: 'PUT'
            });
            if (res.ok) {
                setNotifications(prev => prev.filter(n => n._id !== id));
            }
        } catch (error) {
            console.error("Failed to clear notification", error);
        }
    };


    // Calculate real stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(order => new Date(order.createdAt) >= todayStart);
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.items?.reduce((s, i) => s + (i.price * i.quantity), 0) || 0), 0);
    const activeOrdersCount = orders.filter(o => ['Placed', 'Processing', 'Shipped'].includes(o.status)).length;

    const stats = [
        {
            label: 'Total Products',
            value: products.length.toString(),
            change: `+${products.filter(p => new Date(p.createdAt) >= todayStart).length}`,
            icon: Package,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        },
        {
            label: 'Orders Today',
            value: todayOrders.length.toString(),
            change: `+${todayOrders.length}`,
            icon: ShoppingBag,
            color: 'text-orange-600',
            bg: 'bg-orange-100'
        },
        {
            label: 'Daily Revenue',
            value: `₹${todayRevenue.toFixed(2)}`,
            change: `+${todayOrders.length > 0 ? '100' : '0'}%`,
            icon: CreditCard,
            color: 'text-green-600',
            bg: 'bg-green-100'
        },
        {
            label: 'Active Orders',
            value: activeOrdersCount.toString(),
            change: `+${activeOrdersCount}`,
            icon: Users,
            color: 'text-purple-600',
            bg: 'bg-purple-100'
        },
    ];

    const activeOrders = orders.filter(o => ['Placed', 'Processing', 'Shipped', 'Out for Delivery'].includes(o.status));
    const lowStockProducts = products.filter(p => p.stockQuantity <= (p.lowStockThreshold || 10));

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Dashboard Overview</h2>
                    <p className="text-sm text-gray-500">Welcome back, {storeInfo?.sellerName || 'Seller'}!</p>
                </div>
                <div className="flex items-center space-x-4">
                    {performanceData?.success && (
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-green-100 cursor-help" title={`AI Confidence: ${(performanceData.confidence * 100).toFixed(0)}%`}>
                            <TrendingUp className={`h-4 w-4 ${
                                performanceData.tier === 'Excellent' ? 'text-green-600' : 
                                performanceData.tier === 'Good' ? 'text-blue-600' : 
                                performanceData.tier === 'Average' ? 'text-yellow-600' : 
                                performanceData.tier === 'New Seller' ? 'text-gray-400' : 'text-red-600'
                            }`} />
                            <div className="flex flex-col text-left">
                                <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">AI Tier</span>
                                <span className={`text-[11px] font-bold uppercase leading-tight ${
                                    performanceData.tier === 'Excellent' ? 'text-green-700' : 
                                    performanceData.tier === 'Good' ? 'text-blue-700' : 
                                    performanceData.tier === 'Average' ? 'text-yellow-700' : 
                                    performanceData.tier === 'New Seller' ? 'text-gray-500' : 'text-red-700'
                                }`}>
                                    {performanceData.tier}
                                </span>
                            </div>
                        </div>
                    )}
                    <Button
                        variant="outline"
                        className="relative"
                        onClick={() => setIsNotificationsOpen(true)}
                    >
                        <Bell className="h-5 w-5 text-gray-600" />
                        {notifications.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white ring-2 ring-white">
                                {notifications.length}
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                <h3 className="text-2xl font-bold mt-1 text-gray-800">{stat.value}</h3>
                                <span className="text-xs font-semibold text-green-600 flex items-center mt-1">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    {stat.change}
                                </span>
                            </div>
                            <div className={`p-3 rounded-full ${stat.bg}`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Store Info & Performance Section (Row 2) */}
            <Card className="shadow-sm border-none">
                <CardHeader className="pb-2">
                    <CardTitle>Store Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Column 1: Basic Info */}
                        <div className="space-y-3">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900">{storeInfo?.storeName || 'Fresh Cart - Downtown'}</h3>
                                <p className="text-sm text-gray-500 flex items-start gap-2 mt-1">
                                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                    {storeInfo?.storeAddress || '123 Main Street, Downtown, City'}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">Store ID: FC-DT-{storeInfo?._id?.slice(-4) || '001'}</p>
                            </div>
                        </div>

                        {/* Column 2: Hours */}
                        <div
                            className="space-y-3 cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors group"
                            onClick={() => setIsHoursOpen(true)}
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-700 group-hover:text-green-700">Operating Hours</p>
                                <Clock className="h-4 w-4 text-gray-400 group-hover:text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-sm text-gray-500">{formatOperatingHours(storeInfo?.operatingHours)}</p>

                            {(() => {
                                const status = getStoreStatus(storeInfo?.operatingHours, storeInfo?.storeLeave);
                                return (
                                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                        {status.label}
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Column 3: Performance */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-700">Seller Performance (SVM)</p>
                                {performanceData?.success && (
                                    <Badge className={`
                                        ${performanceData.tier === 'Excellent' ? 'bg-green-100 text-green-800' : ''}
                                        ${performanceData.tier === 'Good' ? 'bg-blue-100 text-blue-800' : ''}
                                        ${performanceData.tier === 'Average' ? 'bg-yellow-100 text-yellow-800' : ''}
                                        ${performanceData.tier === 'Poor' ? 'bg-red-100 text-red-800' : ''}
                                        ${performanceData.tier === 'New Seller' ? 'bg-gray-100 text-gray-800' : ''}
                                        border-none hover:bg-opacity-100
                                    `}>
                                        {performanceData.tier}
                                    </Badge>
                                )}
                            </div>
                            
                            {performanceData?.success ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs text-gray-500">Confidence Score</span>
                                        <span className="text-sm font-bold text-gray-900">
                                            {performanceData.confidence ? `${(performanceData.confidence * 100).toFixed(0)}%` : 'N/A'}
                                        </span>
                                    </div>
                                    <Progress 
                                        value={performanceData.confidence ? performanceData.confidence * 100 : 0} 
                                        className={`h-2 bg-gray-100 ${
                                            performanceData.tier === 'Excellent' ? '[&>div]:bg-green-600' : 
                                            performanceData.tier === 'Good' ? '[&>div]:bg-blue-600' : 
                                            performanceData.tier === 'Average' ? '[&>div]:bg-yellow-600' : 
                                            performanceData.tier === 'New Seller' ? '[&>div]:bg-gray-400' : 
                                            '[&>div]:bg-red-600'
                                        }`} 
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 italic">
                                        {performanceData.message || `Based on ${performanceData.metrics?.review_count || 0} customer reviews`}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-gray-500">Sales Target</span>
                                        <span className="text-sm font-bold text-gray-900">0%</span>
                                    </div>
                                    <Progress value={0} className="h-2 bg-gray-100 [&>div]:bg-gray-900" />
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bottom Section (Row 3) - Active Orders & Low Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Active Orders List */}
                <Card className="shadow-sm border-none">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Active Orders</CardTitle>
                        <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">{activeOrders.length}</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activeOrders.length > 0 ? (
                                activeOrders.slice(0, 5).map((order) => (
                                    <div key={order._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-gray-800">#{order._id.slice(-6).toUpperCase()}</h4>
                                                <Badge className={`
                                                    ${order.status === 'Placed' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-none' : ''}
                                                    ${order.status === 'Processing' ? 'bg-orange-100 text-orange-800 hover:bg-orange-100 border-none' : ''}
                                                    ${order.status === 'Shipped' ? 'bg-green-100 text-green-800 hover:bg-green-100 border-none' : ''}
                                                `}>{order.status}</Badge>
                                            </div>
                                            <p className="text-sm text-gray-500">{order.shippingAddress?.name || 'Customer'} • {order.items?.length || 0} items</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(order.createdAt).toLocaleString('en-IN', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600 text-lg">₹{(order.items?.reduce((s, i) => s + (i.price * i.quantity), 0) || 0).toFixed(2)}</p>
                                            <p className="text-xs text-gray-500 mt-1">{order.paymentMethod || 'COD'}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm">No active orders at the moment</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Low Stock Alerts */}
                <Card className="shadow-sm border-none">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Low Stock Alerts</CardTitle>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                            {lowStockProducts.length}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {lowStockProducts.length > 0 ? (
                                lowStockProducts.slice(0, 5).map((product) => (
                                    <div key={product._id} className="flex items-center justify-between p-3 border border-yellow-200 rounded-lg bg-yellow-50/50 hover:bg-yellow-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                            <div>
                                                <h4 className="font-medium text-gray-900 text-sm">{product.productName}</h4>
                                                <p className="text-xs text-gray-500">{product.quantity} {product.unit} (Alert: {product.lowStockThreshold || 10})</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge className={`mb-1 ${product.stockQuantity <= 5
                                                ? 'bg-red-100 text-red-700 hover:bg-red-100'
                                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                                                }`}>
                                                {product.stockQuantity} left
                                            </Badge>
                                            <p className="text-xs text-gray-600">₹{product.sellingPrice}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm">All products are well-stocked!</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

            </div>

            <OperatingHoursDialog
                open={isHoursOpen}
                onOpenChange={setIsHoursOpen}
                initialData={storeInfo}
                onSave={handleSaveHours}
            />

            <NotificationDialog
                open={isNotificationsOpen}
                onOpenChange={setIsNotificationsOpen}
                notifications={notifications}
                onClear={handleClearNotification}
            />
        </div>
    );
};

export default StoreOverview;
