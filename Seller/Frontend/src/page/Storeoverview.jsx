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
} from 'lucide-react';
import { Badge } from '@/ui/badge';
import { Progress } from '@/ui/progress';
import OperatingHoursDialog from './OperatingHoursDialog';

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

    useEffect(() => {
        try {
            const info = JSON.parse(localStorage.getItem('sellerInfo'));
            setStoreInfo(info?.user || info);
        } catch (e) {
            console.error("Error loading store info", e);
        }
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

    // Mock Data based on requirement
    const stats = [
        { label: 'Total Products', value: '0', change: '+0', icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Orders Today', value: '0', change: '+0', icon: ShoppingBag, color: 'text-orange-600', bg: 'bg-orange-100' },
        { label: 'Daily Revenue', value: '₹0', change: '+0%', icon: CreditCard, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Active Staff', value: '0', change: '+0', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    ];

    const activeOrders = [
    ];

    return (
        <div className="space-y-6">

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
                            <p className="text-sm font-medium text-gray-700">Today's Performance</p>
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-gray-500">Sales Target</span>
                                    <span className="text-sm font-bold text-gray-900">0%</span>
                                </div>
                                <Progress value={0} className="h-2 bg-gray-100 [&>div]:bg-gray-900" />
                            </div>
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
                        <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">0</Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activeOrders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-gray-800">{order.id}</h4>
                                            <Badge className={`
                                                ${order.status === 'preparing' ? 'bg-orange-100 text-orange-800 hover:bg-orange-100 border-none' : ''}
                                                ${order.status === 'ready' ? 'bg-green-100 text-green-800 hover:bg-green-100 border-none' : ''}
                                                ${order.status === 'delivered' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-none' : ''}
                                            `}>{order.status}</Badge>
                                        </div>
                                        <p className="text-sm text-gray-500">{order.customer} • {order.items}</p>
                                        <p className="text-xs text-gray-400 mt-1">{order.time}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600 text-lg">{order.amount}</p>
                                        <p className="text-xs text-gray-500 mt-1">{order.eta}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Low Stock Alerts */}
                <Card className="shadow-sm border-none">
                    <CardHeader>
                        <CardTitle>Low Stock Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>

                    </CardContent>
                </Card>

            </div>

            <OperatingHoursDialog
                open={isHoursOpen}
                onOpenChange={setIsHoursOpen}
                initialData={storeInfo}
                onSave={handleSaveHours}
            />
        </div>
    );
};

export default StoreOverview;
