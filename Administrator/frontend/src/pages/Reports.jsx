import React, { useState } from 'react';
import { Calendar, Download, TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react';

const Reports = () => {
    const [dateRange, setDateRange] = useState('month');

    // Dummy summary stats
    const stats = [
        { title: 'Total Revenue', value: '$0.00', change: '+0%', icon: DollarSign, color: 'bg-green-100 text-green-600' },
        { title: 'Total Orders', value: '0', change: '+0%', icon: ShoppingBag, color: 'bg-blue-100 text-blue-600' },
        { title: 'New Customers', value: '0', change: '+0%', icon: Users, color: 'bg-purple-100 text-purple-600' },
        { title: 'Growth', value: '0%', change: '+0%', icon: TrendingUp, color: 'bg-yellow-100 text-yellow-600' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
                    <p className="text-gray-500">Monitor platform performance and metrics</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-1 rounded-lg border shadow-sm">
                    <select
                        className="bg-transparent border-none text-sm text-gray-600 focus:ring-0 cursor-pointer pl-3 font-medium"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                    >
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                    </select>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-green-600 transition-colors">
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10 text-opacity-100`}>
                                <stat.icon size={24} />
                            </div>
                            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">{stat.title}</h3>
                        <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Placeholder for Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 min-h-[350px] flex flex-col items-center justify-center text-gray-400 hover:shadow-lg transition-shadow duration-300 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-grid-gray-50/[0.05] [mask-image:linear-gradient(0deg,white,transparent)]"></div>
                    <TrendingUp size={64} className="mb-4 text-gray-200 group-hover:text-green-100 transition-colors" />
                    <p className="font-medium text-lg">Revenue Trend Chart</p>
                    <p className="text-sm mt-1 text-gray-400">No data available for the selected period</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 min-h-[350px] flex flex-col items-center justify-center text-gray-400 hover:shadow-lg transition-shadow duration-300 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-grid-gray-50/[0.05] [mask-image:linear-gradient(0deg,white,transparent)]"></div>
                    <Users size={64} className="mb-4 text-gray-200 group-hover:text-blue-100 transition-colors" />
                    <p className="font-medium text-lg">User Growth Chart</p>
                    <p className="text-sm mt-1 text-gray-400">No data available for the selected period</p>
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
                    <button className="text-sm text-green-600 hover:text-green-700 font-medium">View All</button>
                </div>
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <p className="font-medium">No recent activity to report</p>
                    <p className="text-sm mt-1">Activities will appear here real-time.</p>
                </div>
            </div>
        </div>
    );
};

export default Reports;
