import React from 'react';
import { IndianRupee, TrendingUp, Map, Star, Gift, ChevronRight } from 'lucide-react';

const Earnings = () => {
    // Breakdown data with 0 values as per "Remove Demo Data" policy, but showing types
    const earningTypes = [
        { label: 'Base Order Pay', value: '₹0', icon: IndianRupee, color: 'blue', desc: 'Fixed fee per delivery' },
        { label: 'Distance Pay', value: '₹0', icon: Map, color: 'green', desc: 'Based on km traveled' },
        { label: 'Surge Pay', value: '₹0', icon: TrendingUp, color: 'purple', desc: 'Peak hour bonuses' },
        { label: 'Tips', value: '₹0', icon: Star, color: 'yellow', desc: 'Customer contributions' },
        { label: 'Incentives', value: '₹0', icon: Gift, color: 'orange', desc: 'Target achievements' },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Earnings</h1>

            {/* Total Balance Card */}
            <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-6 text-white shadow-lg">
                <div className="text-sm font-medium opacity-90">Total Balance</div>
                <div className="text-4xl font-bold mt-2">₹0.00</div>
                <div className="mt-4 flex gap-3">
                    <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors">
                        Withdraw
                    </button>
                    <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors">
                        View History
                    </button>
                </div>
            </div>

            {/* Earning Breakdown */}
            <div>
                <h2 className="font-semibold text-lg text-gray-800 mb-4">Earning Breakdown</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {earningTypes.map((item, index) => (
                        <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4 hover:border-green-100 transition-colors">
                            <div className={`p-3 rounded-lg bg-${item.color}-50 text-${item.color}-600`}>
                                <item.icon size={20} />
                            </div>
                            <div>
                                <div className="text-gray-500 text-xs font-medium uppercase tracking-wider">{item.label}</div>
                                <div className="text-xl font-bold text-gray-800 mt-0.5">{item.value}</div>
                                <div className="text-xs text-gray-400 mt-1">{item.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Payouts Placeholder */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-semibold text-lg text-gray-800">Recent Transactions</h2>
                    <button className="text-green-600 text-sm font-medium hover:text-green-700">View All</button>
                </div>
                <div className="p-8 text-center text-gray-500">
                    <p>No recent transactions found.</p>
                </div>
            </div>
        </div>
    );
};

export default Earnings;
