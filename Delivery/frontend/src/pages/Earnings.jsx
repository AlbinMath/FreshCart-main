import React, { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, Map, Star, Gift, ChevronRight, Loader2, ArrowUpRight, ArrowDownLeft, Building2, CreditCard, Send, History, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const Earnings = () => {
    const [earningsData, setEarningsData] = useState(null);
    const [withdrawalHistory, setWithdrawalHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBankModal, setShowBankModal] = useState(false);
    const [requesting, setRequesting] = useState(false);
    const [bankForm, setBankForm] = useState({
        accountHolderName: '',
        accountNumber: '',
        ifscCode: '',
        upiId: ''
    });

    const agent = JSON.parse(localStorage.getItem('agent') || '{}');
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchData();
    }, [agent.id, agent._id]);

    const fetchData = async () => {
        try {
            const agentId = agent.id || agent._id;
            const [earningsRes, historyRes, profileRes] = await Promise.all([
                axios.get(`${API_URL}/earnings/${agentId}`),
                axios.get(`${API_URL}/withdrawal/history/${agentId}`),
                axios.get(`${API_URL}/profile/${agentId}`)
            ]);
            
            setEarningsData(earningsRes.data);
            setWithdrawalHistory(historyRes.data.history || []);
            
            if (profileRes.data) {
                setBankForm({
                    accountHolderName: profileRes.data.accountHolderName || '',
                    accountNumber: profileRes.data.bankAccountNumber || '',
                    ifscCode: profileRes.data.ifscCode || '',
                    upiId: profileRes.data.upiId || ''
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBank = async (e) => {
        e.preventDefault();
        try {
            const agentId = agent.id || agent._id;
            await axios.put(`${API_URL}/profile/bank-details/${agentId}`, {
                bankAccountNumber: bankForm.accountNumber,
                ifscCode: bankForm.ifscCode,
                upiId: bankForm.upiId,
                accountHolderName: bankForm.accountHolderName
            });
            toast.success('Bank details updated successfully!');
            setShowBankModal(false);
            
            // Update local agent data for consistency
            const updatedAgent = { ...agent, ...bankForm };
            localStorage.setItem('agent', JSON.stringify(updatedAgent));
        } catch (error) {
            toast.error('Failed to update bank details');
        }
    };

    const handleWithdrawRequest = async () => {
        if (!bankForm.accountNumber && !bankForm.upiId) {
            toast.error('Please setup bank details first');
            setShowBankModal(true);
            return;
        }

        if ((earningsData?.balance || 0) < 100) {
            toast.error('Minimum withdrawal amount is ₹100');
            return;
        }

        try {
            setRequesting(true);
            await axios.post(`${API_URL}/withdrawal/request`, {
                agentId: agent.id || agent._id,
                amount: earningsData.balance
            });
            toast.success('Withdrawal request sent!');
            fetchData();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to send request';
            toast.error(errorMsg);
        } finally {
            setRequesting(false);
        }
    };

    const earningTypes = [
        { label: 'Total Revenue', value: earningsData?.totalEarnings || 0, icon: TrendingUp, color: 'blue', desc: 'Gross earnings from all deliveries' },
        { label: 'Already Withdrawn', value: earningsData?.totalWithdrawn || 0, icon: CheckCircle, color: 'green', desc: 'Successfully transferred to your bank' },
        { label: 'Pending Processing', value: earningsData?.pendingWithdrawals || 0, icon: Clock, color: 'amber', desc: 'Request sent to administrator' },
        { label: 'Withdrawable Balance', value: earningsData?.balance || 0, icon: IndianRupee, color: 'indigo', desc: 'Net available for new withdrawal' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Earnings & Payouts</h1>
                <button 
                    onClick={() => setShowBankModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                >
                    <Building2 size={18} className="text-green-600" /> Bank Settings
                </button>
            </div>

            {/* Total Balance Card */}
            <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <IndianRupee size={120} />
                </div>
                <div className="relative z-10">
                    <div className="text-sm font-medium opacity-90 uppercase tracking-wider">Total Withdrawable Balance</div>
                    <div className="text-5xl font-black mt-2">₹{(earningsData?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className="mt-6 flex gap-3">
                        <button 
                            className="bg-white text-green-600 px-8 py-3 rounded-xl text-sm font-black shadow-lg hover:bg-green-50 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                            onClick={handleWithdrawRequest}
                            disabled={requesting}
                        >
                            {requesting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                            Withdraw Funds Now
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Earning Breakdown */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <TrendingUp size={20} className="text-green-600" /> Summary
                    </h2>
                    {earningTypes.map((item, index) => (
                        <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md hover:border-green-100 transition-all group">
                            <div className={`p-4 rounded-xl bg-${item.color}-50 text-${item.color}-600 group-hover:scale-110 transition-transform`}>
                                <item.icon size={24} />
                            </div>
                            <div>
                                <div className="text-gray-400 text-[10px] font-black uppercase tracking-[0.1em]">{item.label}</div>
                                <div className="text-2xl font-black text-gray-900 mt-0.5">₹{(item.value || 0).toLocaleString('en-IN')}</div>
                                <div className="text-xs text-gray-400 mt-1 font-medium italic">{item.desc}</div>
                            </div>
                        </div>
                    ))}
                    
                    {/* Bank Details Preview */}
                    <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 space-y-3">
                        <h4 className="font-bold text-amber-800 text-sm flex items-center gap-2">
                            <CreditCard size={18}/> Payout Destination
                        </h4>
                        {bankForm.accountNumber || bankForm.upiId ? (
                            <div className="space-y-1">
                                <div className="text-xs font-bold text-amber-900">{bankForm.accountHolderName}</div>
                                <div className="text-[10px] text-amber-700 font-mono">
                                    {bankForm.accountNumber ? `A/C: ****${bankForm.accountNumber.slice(-4)}` : `UPI: ${bankForm.upiId}`}
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-amber-700 italic">No bank account linked. Setup to withdraw.</p>
                        )}
                    </div>
                </div>

                {/* History Tabs */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Recent Transactions */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <ArrowUpRight size={20} className="text-green-600" /> Recent Deliveries
                            </h2>
                        </div>
                        
                        {earningsData?.transactions?.length > 0 ? (
                            <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                                {earningsData.transactions.map((tx, idx) => (
                                    <div key={idx} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                                <ArrowUpRight size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800 text-sm">Order #{(tx.orderId || '').toString().slice(-6).toUpperCase()}</div>
                                                <div className="text-[10px] text-gray-400 font-medium">
                                                    {new Date(tx.date).toLocaleDateString()} • {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-green-600">
                                                +₹{tx.amount.toLocaleString('en-IN')}
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{tx.type}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-gray-500">
                                <p className="font-medium">No recent transactions found.</p>
                            </div>
                        )}
                    </div>

                    {/* Withdrawal History */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <History size={20} className="text-amber-600" /> Payout History
                            </h2>
                        </div>
                        
                        {withdrawalHistory.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {withdrawalHistory.map((w, idx) => (
                                    <div key={idx} className="p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${w.status === 'Approved' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                                <ArrowDownLeft size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-800 text-sm">Payout Request</div>
                                                <div className="text-[10px] text-gray-400 font-medium">
                                                    {new Date(w.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-gray-900">
                                                ₹{w.amount.toLocaleString('en-IN')}
                                            </div>
                                            <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                                w.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                                                w.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {w.status}
                                            </div>
                                            {w.status === 'Approved' && (
                                                <div className="text-[9px] text-green-600 font-bold mt-1 animate-pulse">
                                                    Check bank logs
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                <p>No payout history yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bank Details Modal */}
            {showBankModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900">Set Up Payouts</h3>
                                <p className="text-sm text-gray-500">Enter your bank or UPI details</p>
                            </div>
                            <button onClick={() => setShowBankModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleUpdateBank} className="p-8 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Account Holder Name</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Full Name as per Bank"
                                    className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-green-500 rounded-2xl outline-none transition-all"
                                    value={bankForm.accountHolderName}
                                    onChange={(e) => setBankForm({...bankForm, accountHolderName: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Account Number</label>
                                    <input
                                        type="text"
                                        placeholder="Bank Acc Number"
                                        className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-green-500 rounded-2xl outline-none transition-all"
                                        value={bankForm.accountNumber}
                                        onChange={(e) => setBankForm({...bankForm, accountNumber: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">IFSC Code</label>
                                    <input
                                        type="text"
                                        placeholder="HDFC0001234"
                                        className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-green-500 rounded-2xl outline-none transition-all"
                                        value={bankForm.ifscCode}
                                        onChange={(e) => setBankForm({...bankForm, ifscCode: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">UPI ID (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="agent@upi"
                                    className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-green-500 rounded-2xl outline-none transition-all"
                                    value={bankForm.upiId}
                                    onChange={(e) => setBankForm({...bankForm, upiId: e.target.value})}
                                />
                            </div>
                            <button 
                                type="submit"
                                className="w-full py-4 bg-green-600 text-white rounded-2xl font-black shadow-xl shadow-green-100 hover:bg-green-700 transition-all active:scale-95"
                            >
                                Save Bank Details
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Earnings;
