import React from 'react';
import { Truck, CheckCircle, Clock } from 'lucide-react';

const OrderCard = ({ data }) => {
    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
            case 'shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'processing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getIcon = (status) => {
        switch (status.toLowerCase()) {
            case 'delivered': return <CheckCircle size={16} />;
            case 'shipped': return <Truck size={16} />;
            default: return <Clock size={16} />;
        }
    };

    return (
        <div className="w-full max-w-[260px] bg-white rounded-xl shadow-sm border border-gray-100 p-4 my-2">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <span className="text-xs text-gray-400">Order ID</span>
                    <p className="text-xs font-mono text-gray-600">#{data.orderId.slice(-6)}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-medium uppercase border flex items-center gap-1 ${getStatusColor(data.status)}`}>
                    {getIcon(data.status)}
                    {data.status}
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center text-sm border-b border-dashed border-gray-100 pb-2">
                    <span className="text-gray-500">Items</span>
                    <span className="font-medium text-gray-800 break-words max-w-[120px] text-right text-xs">{data.items}</span>
                </div>

                {data.otp && data.status !== 'Delivered' && (
                    <div className="bg-fresh-50 rounded-lg p-2 flex justify-between items-center">
                        <span className="text-xs text-fresh-700 font-medium">Delivery OTP</span>
                        <span className="text-lg font-bold text-fresh-800 tracking-wider">{data.otp}</span>
                    </div>
                )}

                <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-gray-500">Total Amount</span>
                    <span className="font-bold text-gray-900">₹{data.total}</span>
                </div>
            </div>
        </div>
    );
};

export default OrderCard;
