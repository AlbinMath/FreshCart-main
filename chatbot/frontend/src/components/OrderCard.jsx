import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';

const OrderCard = ({ order }) => {
    const getStatusColor = (status) => {
        const colors = {
            'Placed': 'bg-blue-100 text-blue-700',
            'Processing': 'bg-yellow-100 text-yellow-700',
            'Shipped': 'bg-purple-100 text-purple-700',
            'Out for Delivery': 'bg-orange-100 text-orange-700',
            'Delivered': 'bg-green-100 text-green-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const getStatusIcon = (status) => {
        const icons = {
            'Placed': <Clock size={16} />,
            'Processing': <Package size={16} />,
            'Shipped': <Truck size={16} />,
            'Out for Delivery': <Truck size={16} />,
            'Delivered': <CheckCircle size={16} />
        };
        return icons[status] || <Package size={16} />;
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 shadow-sm border border-gray-200"
        >
            {/* Order ID */}
            <div className="flex items-center justify-between mb-3">
                <div>
                    <p className="text-xs text-gray-500">Order ID</p>
                    <p className="font-mono text-sm font-semibold text-gray-800">
                        #{order.id.slice(-8).toUpperCase()}
                    </p>
                </div>

                {/* Status Badge */}
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="text-xs font-semibold">{order.status}</span>
                </div>
            </div>

            {/* Order Details */}
            <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Items:</span>
                    <span className="font-semibold text-gray-800">{order.items}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-bold text-green-600">₹{order.total}</span>
                </div>
            </div>

            {/* Delivery OTP */}
            {order.otp && order.otp !== 'N/A' && order.status !== 'Delivered' && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 mt-3">
                    <p className="text-xs text-gray-600 mb-1">Delivery OTP</p>
                    <p className="text-2xl font-bold text-green-600 tracking-wider font-mono">
                        {order.otp}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Share this with delivery agent</p>
                </div>
            )}

            {/* Track Order Button */}
            <button className="w-full mt-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm py-2 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2">
                <Truck size={16} />
                Track Order
            </button>
        </motion.div>
    );
};

export default OrderCard;
