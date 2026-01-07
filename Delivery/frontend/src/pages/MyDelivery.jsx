import React from 'react';
import { Package, CheckCircle, Clock, MapPin, Calendar, ChevronRight } from 'lucide-react';

const MyDelivery = () => {
    // Placeholder data structures - aligned with "Remove Demo Data" policy (empty by default)
    const currentDelivery = null;
    const todayStats = { assigned: 0, completed: 0 };
    const history = [];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">My Deliveries</h1>

            {/* 1. Current Running Status */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Clock className="text-blue-600" size={20} />
                    Current Status
                </h2>

                {currentDelivery ? (
                    <div className="border border-green-100 bg-green-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-gray-800">Order #{currentDelivery.id}</h3>
                                <p className="text-sm text-gray-600 mt-1">{currentDelivery.address}</p>
                            </div>
                            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded font-medium">
                                In Progress
                            </span>
                        </div>
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

            {/* 3. Previous Days Listing */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <Calendar className="text-purple-600" size={20} />
                        Previous History
                    </h2>
                    <span className="text-xs text-gray-500">Last 30 Days</span>
                </div>

                {history.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {history.map((item, index) => (
                            <div key={index} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group cursor-pointer">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-800">Order #{item.id}</div>
                                        <div className="text-xs text-gray-500">{item.date} • {item.address}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-green-600 font-medium text-sm">{item.price}</span>
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
        </div>
    );
};

export default MyDelivery;
