import React, { useState, useEffect } from 'react';
import { Badge } from '@/ui/badge';
import { Eye, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Search, Filter, ShoppingCart } from 'lucide-react';
import OrderDetailsDialog from './OrderDetailsDialog';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [performanceData, setPerformanceData] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const fetchPerformance = async (sid) => {
        try {
            const res = await fetch(`http://localhost:6002/evaluate/${sid}`);
            if (res.ok) {
                const data = await res.json();
                setPerformanceData(data);
            }
        } catch (error) {
            console.error("Failed to fetch performance evaluation", error);
        }
    };

    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setIsDialogOpen(true);
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                // Optimistic update or refetch
                setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
            }
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    const fetchOrders = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            const sellerInfoStr = localStorage.getItem('sellerInfo');
            if (!sellerInfoStr) return;

            const parsed = JSON.parse(sellerInfoStr);
            const seller = parsed.user || parsed;
            const idToFetch = seller._id;

            if (!idToFetch) return;

            // Fetch orders for this seller
            const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/seller/${idToFetch}`);
            if (response.ok) {
                const data = await response.json();
                setOrders(data);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchOrders();

        const sellerInfoStr = localStorage.getItem('sellerInfo');
        if (sellerInfoStr) {
            const parsed = JSON.parse(sellerInfoStr);
            const seller = parsed.user || parsed;
            fetchPerformance(seller.sellerUniqueId || seller._id);
        }

        // Poll every 10 seconds
        const interval = setInterval(() => {
            fetchOrders(true);
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Placed': return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50';
            case 'Shipped': return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
            case 'Start Delivery': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
            case 'Delivered': return 'bg-green-100 text-green-800 hover:bg-green-100';
            case 'Cancelled': return 'bg-red-100 text-red-800 hover:bg-red-100';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Order Processing</h2>
                    <p className="text-muted-foreground mt-1">Manage and track your customer orders.</p>
                </div>
                
                {performanceData?.success && (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-blue-100">
                        <div className={`p-2 rounded-lg ${
                            performanceData.tier === 'Excellent' ? 'bg-green-50 text-green-600' : 
                            performanceData.tier === 'Good' ? 'bg-blue-50 text-blue-600' : 
                            performanceData.tier === 'Average' ? 'bg-yellow-50 text-yellow-600' : 
                            performanceData.tier === 'New Seller' ? 'bg-gray-50 text-gray-400' : 'bg-red-50 text-red-600'
                        }`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase">Seller Tier</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    performanceData.tier === 'Excellent' ? 'bg-green-100 text-green-700' : 
                                    performanceData.tier === 'Good' ? 'bg-blue-100 text-blue-700' : 
                                    performanceData.tier === 'Average' ? 'bg-yellow-100 text-yellow-700' : 
                                    performanceData.tier === 'New Seller' ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-700'
                                }`}>
                                    {performanceData.tier}
                                </span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5">
                                <span className="text-sm font-bold text-gray-800">{((performanceData.confidence || 0) * 100).toFixed(0)}% AI Confidence</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle>Recent Orders</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    type="search"
                                    placeholder="Search orders..."
                                    className="pl-8 w-[250px]"
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {orders.length > 0 ? (
                        <div className="rounded-md border">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700 uppercase font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Order ID</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Customer</th>
                                        <th className="px-4 py-3">Total</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {orders.map((order) => (
                                        <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                <div className="flex items-center gap-1 group">
                                                    <span>{order.orderId || order._id.slice(-6).toUpperCase()}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigator.clipboard.writeText(order.orderId || order._id);
                                                            // Could add toast here if desired
                                                        }}
                                                        title="Copy ID"
                                                    >
                                                        <span className="sr-only">Copy</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{order.shippingAddress?.name || 'Unknown'}</div>
                                                <div className="text-xs text-gray-500">{order.shippingAddress?.city}</div>
                                            </td>
                                            <td className="px-4 py-3 font-medium">₹{order.totalAmount}</td>
                                            <td className="px-4 py-3">
                                                <Badge className={`${getStatusColor(order.status)} border-0`}>
                                                    {order.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => handleViewOrder(order)} title="View Details">
                                                        <Eye className="h-4 w-4 text-gray-500" />
                                                    </Button>

                                                    {['Placed', 'Pending', 'Processing'].includes(order.status) && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleStatusUpdate(order._id, 'Shipped')}
                                                                title="Complete Preparation (Mark Shipped)"
                                                                className="hover:bg-green-50"
                                                            >
                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg bg-gray-50/50">
                            <div className="bg-gray-100 p-4 rounded-full mb-4">
                                <ShoppingCart className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">No Orders Found</h3>
                            <p className="text-sm text-gray-500 max-w-sm mt-1 mb-4">
                                You haven't received any orders yet. When customers place orders, they will appear here.
                            </p>
                            <Button variant="outline" onClick={() => fetchOrders()}>Refresh List</Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <OrderDetailsDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                order={selectedOrder}
            />
        </div>
    );
};

export default Orders;
