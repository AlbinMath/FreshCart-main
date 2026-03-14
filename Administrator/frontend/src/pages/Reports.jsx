import React, { useState, useEffect } from 'react';
import { Calendar, Download, TrendingUp, Users, ShoppingBag, DollarSign, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

const Reports = () => {
    const [dateRange, setDateRange] = useState('month');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/reports/stats?range=${dateRange}`);
                if (response.ok) {
                    const result = await response.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Error fetching reports:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, [dateRange]);

    const exportToCSV = () => {
        if (!data) return;
        const { summary, trends } = data;
        
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Metric,Value\n";
        csvContent += `Monthly Revenue,${summary.totalRevenue}\n`;
        csvContent += `Platform Profit,${summary.platformProfit}\n`;
        csvContent += `New Customers,${summary.newUsers}\n`;
        csvContent += `Total Customers,${summary.totalCustomers}\n`;
        csvContent += `Total Sellers,${summary.totalSellers}\n`;
        csvContent += `Total Delivery Agents,${summary.totalDelivery}\n\n`;
        
        csvContent += "Month,Revenue,Profit\n";
        trends.monthlyRevenue.forEach(t => {
            csvContent += `${t.name},${t.revenue},${t.profit}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `FreshCart_Report_${dateRange}_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    const { summary, trends } = data;

    const stats = [
        { title: 'Monthly Revenue', value: `₹${summary.totalRevenue.toLocaleString()}`, change: `${summary.revenueGrowth}%`, icon: DollarSign, color: 'bg-green-100 text-green-600', trend: summary.revenueGrowth >= 0 ? 'up' : 'down' },
        { title: 'Platform Profit', value: `₹${summary.platformProfit.toLocaleString()}`, change: '30% Cut', icon: TrendingUp, color: 'bg-blue-100 text-blue-600', trend: 'up' },
        { title: 'New Customers', value: summary.newUsers, change: 'This Month', icon: Users, color: 'bg-purple-100 text-purple-600', trend: 'up' },
        { title: 'Payouts (Approved)', value: `₹${summary.approvedPayouts.toLocaleString()}`, change: `Pending: ₹${summary.pendingPayouts.toLocaleString()}`, icon: ShoppingBag, color: 'bg-orange-100 text-orange-600', trend: 'neutral' },
    ];

    // Helper for simple bar chart
    const maxRevenue = Math.max(...trends.monthlyRevenue.map(t => t.revenue), 1);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                        <div className="p-2 bg-green-600 text-white rounded-lg shadow-lg shadow-green-100"><Activity size={20}/></div>
                        Reports & Analytics
                    </h1>
                    <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Platform performance and metrics</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border shadow-sm">
                    <select
                        className="bg-transparent border-none text-xs text-gray-600 focus:ring-0 cursor-pointer pl-4 font-black uppercase tracking-tighter"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                    >
                        <option value="month">Current Month</option>
                        <option value="year">Full Year</option>
                    </select>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <button 
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-black text-gray-600 hover:text-green-600 transition-all uppercase tracking-tighter hover:bg-green-50 rounded-xl"
                    >
                        <Download size={14} />
                        Export Data
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <stat.icon size={48} />
                        </div>
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${stat.color} shadow-sm`}>
                                <stat.icon size={20} />
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-full border flex items-center gap-1 ${
                                stat.trend === 'up' ? 'text-green-600 bg-green-50 border-green-100' : 
                                stat.trend === 'down' ? 'text-red-600 bg-red-50 border-red-100' :
                                'text-gray-600 bg-gray-50 border-gray-100'
                            }`}>
                                {stat.trend === 'up' && <ArrowUpRight size={10}/>}
                                {stat.trend === 'down' && <ArrowDownRight size={10}/>}
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{stat.title}</h3>
                        <p className="text-2xl font-black text-gray-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-lg font-black text-gray-800">Monthly Revenue Trend</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Last 6 Months performance</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-[10px] font-black text-gray-400 uppercase">Revenue</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-[10px] font-black text-gray-400 uppercase">Profit</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="h-[250px] flex items-end justify-between gap-4 px-2">
                        {trends.monthlyRevenue.map((t, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 text-white text-[10px] py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none font-black shadow-xl">
                                    ₹{t.revenue.toLocaleString()}
                                </div>
                                
                                <div className="w-full flex flex-col gap-1 items-center h-full justify-end">
                                    {/* Revenue Bar */}
                                    <div 
                                        className="w-full bg-green-100 rounded-t-xl group-hover:bg-green-200 transition-colors shadow-inner"
                                        style={{ height: `${(t.revenue / maxRevenue) * 100}%` }}
                                    >
                                        <div className="w-full bg-green-500 rounded-t-xl h-full opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                    </div>
                                    {/* Profit Line (Visual Marker) */}
                                    <div className="w-full h-1 bg-blue-500 rounded-full opacity-50"></div>
                                </div>
                                
                                <span className="text-[10px] font-black text-gray-400 mt-4 uppercase tracking-tighter">{t.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Growth Distribution */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-black text-gray-800 mb-8">User Distribution</h3>
                    <div className="space-y-6">
                        {[
                            { label: 'Customers', value: summary.totalCustomers, color: 'bg-emerald-500', icon: Users },
                            { label: 'Sellers', value: summary.totalSellers, color: 'bg-purple-500', icon: ShoppingBag },
                            { label: 'Delivery Agents', value: summary.totalDelivery, color: 'bg-orange-500', icon: Activity },
                        ].map((u, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${u.color} bg-opacity-10 text-opacity-100`} style={{ color: u.color.replace('bg-', '') }}>
                                            <u.icon size={14}/>
                                        </div>
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{u.label}</span>
                                    </div>
                                    <span className="text-sm font-black text-gray-900">{u.value}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${u.color} rounded-full transition-all duration-1000`} 
                                        style={{ width: `${(u.value / (summary.totalCustomers + summary.totalSellers + summary.totalDelivery)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm text-green-600">
                             <TrendingUp size={20}/>
                        </div>
                        <div>
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Growth Trend</p>
                             <p className="text-xs font-bold text-gray-700">Platform is expanding with {summary.newUsers} new Customers this month.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Ledger Placeholder */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Calendar size={18}/></div>
                        Revenue Analysis
                    </h3>
                    <button className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-xl transition-all">Details View</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-gray-50">
                                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Metric</th>
                                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Value</th>
                                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Platform Cut (30%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                             <tr className="group">
                                <td className="py-5 font-bold text-gray-800 text-sm">Monthly Gross Revenue</td>
                                <td className="py-5 text-right font-black text-sm">₹{summary.totalRevenue.toLocaleString()}</td>
                                <td className="py-5 text-right font-black text-green-600 text-sm">₹{summary.platformProfit.toLocaleString()}</td>
                             </tr>
                             <tr>
                                <td className="py-5 font-bold text-gray-800 text-sm">Approved Payouts</td>
                                <td className="py-5 text-right font-black text-sm">₹{summary.approvedPayouts.toLocaleString()}</td>
                                <td className="py-5 text-right font-bold text-gray-400 text-xs">-</td>
                             </tr>
                             <tr className="bg-gray-50/50">
                                <td className="py-5 px-4 rounded-l-2xl font-black text-gray-900 text-sm italic underline decoration-indigo-200">Total Retained Profit</td>
                                <td className="py-5 text-right font-black text-sm italic">₹{(summary.platformProfit).toLocaleString()}</td>
                                <td className="py-5 px-4 text-right rounded-r-2xl font-black text-indigo-600 text-lg">₹{summary.platformProfit.toLocaleString()}</td>
                             </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Reports;
