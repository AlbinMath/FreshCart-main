import React from 'react';
import { X, Package, MapPin, User, IndianRupee, Calendar, Phone, Info } from 'lucide-react';
import ProductDetailsDialog from './ProductDetailsDialog';


const OrderDetailsDialog = ({ isOpen, onClose, order }) => {
    if (!isOpen || !order) return null;

    const [selectedProduct, setSelectedProduct] = React.useState(null);
    const [isProductLoading, setIsProductLoading] = React.useState(false);
    const [showProductDialog, setShowProductDialog] = React.useState(false);

    const handleItemClick = async (item) => {
        // Assume item.productId or item._id holds the reference
        const productId = item.productId || item._id; // Adjust based on actual data structure

        // If order item doesn't store the real Product ID (only copy), we might default to item._id
        // But if item._id is subdoc ID, we need the real product ref.
        // Assuming item.product or item.productId is present. 
        // If the item object in order items array HAS the original _id from products collection as `_id` or `productId`.
        // Let's rely on item._id (as seen in user sample for features it had _id, but features are subdocs).
        // Order Items usually: { _id: "...", productName: "...", ... } 
        // The user sample of ORDER in Step 221 says: items: Array(1). It doesn't show inside.
        // But usually standard is `productId` or `_id`. 
        // Let's try to fetch using item._id first.

        if (!productId) return;

        setIsProductLoading(true);
        try {
            // Updated to use the correct port if needed, or relative path if proxy set up
            // Assuming standard API structure
            // Using absolute URL to ensure hitting backend port 5007
            const response = await fetch(`http://localhost:5007/api/delivery-agent/product/${productId}`);
            if (response.ok) {
                const data = await response.json();
                setSelectedProduct(data);
                setShowProductDialog(true);
            } else {
                console.error("Failed to fetch product details");
            }
        } catch (error) {
            console.error("Error fetching product:", error);
        } finally {
            setIsProductLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Package className="text-blue-600" size={24} />
                            Order Details
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Order ID & Status */}
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500">Order ID</p>
                                <p className="text-lg font-bold text-gray-800">#{order._id}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                {order.status}
                            </span>
                        </div>

                        {/* Customer Details */}
                        <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <User size={18} /> Customer Info
                            </h3>
                            <div className="space-y-1 text-sm">
                                <p className="flex justify-between">
                                    <span className="text-gray-500">Name:</span>
                                    <span className="font-medium">{order.shippingAddress?.fullName || 'N/A'}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-gray-500">Phone:</span>
                                    <span className="font-medium flex items-center gap-1">
                                        <Phone size={12} /> {order.shippingAddress?.phoneNumber || 'N/A'}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                                <MapPin size={18} className="text-blue-600" /> Delivery Address
                            </h3>
                            <p className="text-blue-800 text-sm leading-relaxed">
                                {order.shippingAddress ? (
                                    <>
                                        {order.shippingAddress.street}, {order.shippingAddress.city},<br />
                                        {order.shippingAddress.state} - {order.shippingAddress.zipCode}
                                    </>
                                ) : (
                                    "Address not available"
                                )}
                            </p>
                        </div>

                        {/* Order Items */}
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <Package size={18} /> Items ({order.items?.length || 0})
                            </h3>
                            <div className="space-y-3">
                                {order.items?.map((item, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleItemClick(item)}
                                        className="flex gap-4 p-3 border border-gray-100 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer group"
                                    >
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                                            {item.image ? (
                                                <img src={item.image} alt={item.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <Package size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800 line-clamp-1 group-hover:text-blue-700">{item.productName}</p>
                                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                            <p className="text-sm font-semibold text-gray-800">₹{item.price}</p>
                                        </div>
                                        <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Info size={18} className="text-blue-500" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100 space-y-2">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-green-800">
                                    <IndianRupee size={20} />
                                    <span className="font-medium">Total Amount</span>
                                </div>
                                <span className="text-xl font-bold text-green-700">₹{order.totalAmount}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-2 border-t border-green-200">
                                <span className="text-green-800">Payment: {order.paymentMethod || 'N/A'}</span>
                                <span className={`font-medium ${order.paymentStatus === 'Paid' ? 'text-green-700' : 'text-orange-600'}`}>
                                    {order.paymentStatus || 'Pending'}
                                </span>
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="text-xs text-gray-400 flex justify-between px-2">
                            <span>Ordered: {new Date(order.createdAt).toLocaleDateString()}</span>
                            <span>Updated: {new Date(order.updatedAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-100 sticky bottom-0 bg-white">
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors active:scale-[0.98]"
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            </div>

            {/* Product Details Modal */}
            <ProductDetailsDialog
                isOpen={showProductDialog}
                onClose={() => setShowProductDialog(false)}
                product={selectedProduct}
            />
        </>
    );
};

export default OrderDetailsDialog;
