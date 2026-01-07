import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, ListOrdered } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";

const Orders = () => {
    // State for orders (empty initially as requested)
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Dialog State
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5003'}/api/orders`);
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load orders');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Order Monitoring</h1>
                    <p className="text-gray-500">Track and manage customer orders</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm hover:shadow-md">
                    <Download size={20} />
                    Export Orders
                </button>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between transition-shadow hover:shadow-lg">
                <div className="flex flex-col md:flex-row items-center gap-4 flex-1 w-full">
                    <div className="relative flex-1 w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by order ID, customer name..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter size={20} className="text-gray-400" />
                        <select
                            className="w-full md:w-auto border rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="placed">placed</option>
                            <option value="started delivery">Started Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders.length > 0 ? (
                                orders
                                    .filter(order => {
                                        const matchesSearch =
                                            order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            (order.shippingAddress?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
                                        const matchesStatus = filterStatus === 'all' || order.status.toLowerCase() === filterStatus.toLowerCase();
                                        return matchesSearch && matchesStatus;
                                    })
                                    .map((order) => (
                                        <tr key={order._id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 text-sm font-medium text-blue-600">#{order._id.substring(0, 8)}...</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{order.shippingAddress?.name || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{order.items?.length || 0} items</td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{order.totalAmount}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                                                ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                        order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                                                order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                                    'bg-gray-100 text-gray-700'}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setIsDialogOpen(true);
                                                    }}
                                                    className="text-gray-400 hover:text-green-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                <ListOrdered className="text-gray-300" size={32} />
                                            </div>
                                            <p className="text-lg font-medium text-gray-900">No orders found</p>
                                            <p className="text-sm text-gray-500 max-w-sm mt-1">New orders will appear here. Check back later or clear filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Order Details Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Order Details</DialogTitle>
                        <DialogDescription>
                            Order ID: <span className="font-mono font-medium text-foreground">#{selectedOrder?._id}</span>
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <ScrollArea className="flex-1 pr-4">
                            <div className="grid gap-6 py-4">
                                {/* Status and Date */}
                                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Order Date</p>
                                        <p className="text-sm">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full inline-block mt-1
                                            ${selectedOrder.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                selectedOrder.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    selectedOrder.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                                        selectedOrder.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-100 text-gray-700'}`}>
                                            {selectedOrder.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div className="space-y-2 border p-4 rounded-lg">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        Shipping Address
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="font-medium">{selectedOrder.shippingAddress?.name}</p>
                                            <p>{selectedOrder.shippingAddress?.street}</p>
                                            <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}</p>
                                            <p>{selectedOrder.shippingAddress?.zipCode}, {selectedOrder.shippingAddress?.country}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p><span className="text-muted-foreground">Payment Method:</span> {selectedOrder.paymentMethod}</p>
                                            <p><span className="text-muted-foreground">Payment Status:</span> {selectedOrder.paymentStatus}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold">Order Items ({selectedOrder.items?.length})</h3>
                                    <div className="space-y-3">
                                        {selectedOrder.items?.map((item, index) => (
                                            <div key={index} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                                {/* Product Image */}
                                                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                                    {item.image ? (
                                                        <img
                                                            src={item.image}
                                                            alt={item.productName}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                                                            No Img
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Product Details */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {item.productName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Qty: {item.quantity} × ₹{item.price}
                                                    </p>
                                                </div>

                                                {/* Total Price */}
                                                <div className="text-sm font-medium text-gray-900">
                                                    ₹{item.quantity * item.price}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Order Summary */}
                                <div className="flex justify-end pt-4 border-t">
                                    <div className="w-full max-w-xs space-y-2">
                                        <div className="flex justify-between text-base font-bold text-gray-900">
                                            <span>Total Amount</span>
                                            <span>₹{selectedOrder.totalAmount}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Orders;
