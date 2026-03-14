import React from 'react';
import { Users, UserCheck, Clock, ShoppingBag, Landmark, ArrowUpRight, ArrowDownRight, CreditCard, ChevronDown, ArrowDown, X } from 'lucide-react';

const DashboardOverview = () => {
    const [statsData, setStatsData] = React.useState({
        totalUsers: 0,
        customerUsers: 0,
        deliveryUsers: 0,
        sellerUsers: 0
    });
    const [financialStats, setFinancialStats] = React.useState({
        totalRevenue: 0,
        totalWithdrawals: 0,
        pendingPayouts: 0,
        adminProfit: 0
    });
    const [history, setHistory] = React.useState([]);
    const [loadingHistory, setLoadingHistory] = React.useState(true);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = React.useState(false);
    
    const historyEndRef = React.useRef(null);
    const historyContainerRef = React.useRef(null);

    const scrollToBottom = () => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/users/stats/count');
                if (response.ok) {
                    const data = await response.json();
                    setStatsData(data);
                }
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            }
        };

        const fetchFinancialStats = async () => {
            try {
                const response = await fetch('/api/admin/payments/stats/financial');
                if (response.ok) {
                    const data = await response.json();
                    setFinancialStats(data);
                }
            } catch (error) {
                console.error("Error fetching financial stats:", error);
            }
        };

        const fetchHistory = async () => {
            try {
                const response = await fetch('/api/admin/payments/history');
                if (response.ok) {
                    const data = await response.json();
                    setHistory(data.history || []);
                }
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoadingHistory(false);
            }
        };

        fetchStats();
        fetchFinancialStats();
        fetchHistory();
    }, []);

    const userStats = [
        { title: 'Total Users', value: statsData.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Customers', value: statsData.customerUsers, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        { title: 'Delivary Agents', value: statsData.deliveryUsers, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
        { title: 'Sellers', value: statsData.sellerUsers, icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-100' },
    ];

    const finStats = [
        { title: 'Total Revenue', value: `₹${financialStats.totalRevenue.toLocaleString()}`, icon: ArrowUpRight, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'Total Payouts', value: `₹${financialStats.totalWithdrawals.toLocaleString()}`, icon: ArrowDownRight, color: 'text-red-600', bg: 'bg-red-100' },
        { title: 'Pending Payouts', value: `₹${financialStats.pendingPayouts.toLocaleString()}`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
        { title: 'Platform Profit (30%)', value: `₹${financialStats.adminProfit.toLocaleString()}`, icon: Landmark, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    ];

    const deliveryHistory = history.filter(h => h.type === 'B2C Order');
    const paymentHistory = history.filter(h => 
        h.type !== 'C2B Purchase' || h.status !== 'Offline - Cash Payment'
    );

    return (
        <div className="space-y-6">
            {/* Financial Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {finStats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-all hover:shadow-md border-b-4 border-b-transparent hover:border-b-current" style={{ color: stat.color.split('-')[1] === '600' ? stat.color.split('-')[1] : '' }}>
                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{stat.title}</p>
                            <h3 className="text-xl font-black text-gray-900">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* User Stats Card */}
            <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {userStats.map((stat, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                                <stat.icon size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{stat.title}</p>
                                <h3 className="text-lg font-black text-gray-900">{stat.value}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Delivery History */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                         <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><ShoppingBag size={18}/></div>
                              Customer Purchase History
                         </h3>
                    </div>
                    {loadingHistory ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl" />)}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {deliveryHistory.slice(0, 5).map(d => (
                                        <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="text-xs font-bold text-gray-900">{d.orderId ? `#${d.orderId}` : `#...${d.id.slice(-6)}`}</p>
                                                <p className="text-[10px] text-gray-400 font-medium">{new Date(d.date).toLocaleDateString()}</p>
                                            </td>
                                             <td className="px-4 py-3 text-xs font-bold text-gray-600 truncate max-w-[100px]">{d.userName}</td>
                                             <td className="px-4 py-3 text-xs font-black text-emerald-600">₹{d.amount.toLocaleString()}</td>
                                             <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                                                    d.shippingStatus === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                    d.shippingStatus === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {d.shippingStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {deliveryHistory.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="px-4 py-8 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">No Recent Purchases</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Payment History */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                             <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><CreditCard size={18}/></div>
                             Payments & Withdrawals
                        </h3>
                        <button 
                            onClick={() => setIsHistoryModalOpen(true)}
                            className="text-[10px] font-black uppercase text-emerald-600 hover:underline tracking-widest"
                        >
                            View All
                        </button>
                    </div>
                    {loadingHistory ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl" />)}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Entity</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {paymentHistory.slice(0, 5).map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="text-xs font-black text-gray-900 leading-tight">{p.userName}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[9px] text-gray-400 uppercase font-black tracking-tighter">{p.type === 'B2C Order' ? 'Customer Purchase' : p.type}</p>
                                                    {p.orderId && (
                                                        <span className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter">#{p.orderId}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={`px-4 py-3 text-xs font-black ${p.type === 'Withdrawal' ? 'text-red-600' : 'text-green-600'}`}>
                                                {p.type === 'Withdrawal' ? '-' : '+'}₹{p.amount.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-[9px] font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 uppercase tracking-tighter">
                                                    {p.method}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {paymentHistory.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="px-4 py-8 text-center text-xs text-gray-400 font-bold uppercase tracking-widest">No Recent Transactions</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Administrator Profile (Moved to bottom) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                        <div className="p-2 bg-gray-100 text-gray-600 rounded-lg"><Users size={18}/></div>
                        Administrator Profile
                    </h3>
                    <span className="bg-red-50 text-red-500 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">Secure Access</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Name</label>
                        <p className="font-bold text-gray-900">Administrator</p>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email</label>
                        <p className="font-bold text-gray-900">freshcart912@gmail.com</p>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Role</label>
                        <p className="font-bold text-gray-900">Super Admin</p>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Status</label>
                        <div className="flex items-center gap-2 text-green-600">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                             <p className="font-black text-[10px] uppercase">Active</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Modal */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center items-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl scale-95 animate-in zoom-in duration-300">
                        {/* Modal Header */}
                        <div className="p-8 border-b bg-gray-50/50 flex justify-between items-center relative">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shadow-sm border border-emerald-200/50">
                                    <CreditCard size={28}/>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Full Transaction Audit</h2>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Payments, Withdrawals & Order History</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={scrollToBottom}
                                    className="p-2 bg-white text-gray-400 hover:text-emerald-600 rounded-xl border border-gray-100 shadow-sm transition-all hover:scale-110 active:scale-95 group" 
                                    title="Scroll to Bottom"
                                >
                                    <ArrowDown size={20} className="group-hover:translate-y-0.5 transition-transform"/>
                                </button>
                                <button 
                                    onClick={() => setIsHistoryModalOpen(false)} 
                                    className="p-2 bg-white text-gray-400 hover:text-red-500 rounded-xl border border-gray-100 shadow-sm transition-all"
                                >
                                    <X size={20}/>
                                </button>
                            </div>
                        </div>
                        
                        {/* Modal Body */}
                        <div 
                            ref={historyContainerRef}
                            className="flex-1 overflow-y-auto p-8 space-y-6 bg-white custom-scrollbar scroll-smooth"
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 border-b border-gray-100 sticky top-0 bg-white z-10">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date & Time</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {history.map((h, idx) => (
                                            <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="text-xs font-bold text-gray-900">{new Date(h.date).toLocaleDateString()}</div>
                                                    <div className="text-[9px] text-gray-400 font-medium uppercase tracking-tighter">{new Date(h.date).toLocaleTimeString()}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-xs font-black text-gray-900">{h.userName}</div>
                                                    <div className="text-[9px] text-gray-400 font-mono">
                                                        {h.orderId ? `#${h.orderId}` : `#...${h.id.slice(-6)}`}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                                        h.type === 'Withdrawal' ? 'bg-red-50 text-red-600 border-red-100' : 
                                                        h.type === 'B2C Order' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    }`}>
                                                        {h.type === 'B2C Order' ? 'Customer Purchase' : h.type}
                                                    </span>
                                                </td>
                                                <td className={`px-6 py-4 text-xs font-black text-right ${h.type === 'Withdrawal' ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    {h.type === 'Withdrawal' ? '-' : '+'}₹{h.amount.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div ref={historyEndRef} />
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-gray-50/80 border-t flex justify-between items-center px-10">
                            <div className="flex gap-8">
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Transaction Value</p>
                                    <p className="text-lg font-black text-gray-900">₹{(financialStats.totalRevenue + financialStats.totalWithdrawals).toLocaleString()}</p>
                                </div>
                                <div className="w-px h-8 bg-gray-200"></div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Entry Volume</p>
                                    <p className="text-lg font-black text-gray-900">{history.length} Records</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsHistoryModalOpen(false)}
                                className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                            >
                                Close Audit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardOverview;
