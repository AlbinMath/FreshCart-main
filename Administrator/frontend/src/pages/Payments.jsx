import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, CheckCircle, XCircle, DollarSign, Clock, Eye, User, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_URL = 'http://localhost:5003/api/admin/payments';

const Payments = () => {
    const [requests, setRequests] = useState([]);
    const [sellerRequests, setSellerRequests] = useState([]);
    const [deliveryRequests, setDeliveryRequests] = useState([]);
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('requests');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [processingPayout, setProcessingPayout] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    // Modal states
    const [selectedUser, setSelectedUser] = useState(null);
    const [userHistory, setUserHistory] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);

    // Action Modal states
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionData, setActionData] = useState({ id: '', status: '', note: '', transactionId: '', isSeller: false, isDelivery: false });
    const [showRevertModal, setShowRevertModal] = useState(false);
    const [revertId, setRevertId] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState('');

    useEffect(() => {
        // Load Razorpay Script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        fetchData();
        // Auto refresh every 10 seconds
        const interval = setInterval(() => {
            fetchData(false);
        }, 10000);
        return () => {
            clearInterval(interval);
            document.body.removeChild(script);
        };
    }, []);

    const fetchData = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const [reqRes, sellReqRes, delReqRes, histRes] = await Promise.all([
                axios.get(`${API_URL}/withdrawal-requests`),
                axios.get(`${API_URL}/seller-withdrawals`),
                axios.get(`${API_URL}/delivery-withdrawals`),
                axios.get(`${API_URL}/history`)
            ]);
            setRequests(reqRes.data.requests);
            setSellerRequests(sellReqRes.data.requests);
            setDeliveryRequests(delReqRes.data.requests);
            setHistory(histRes.data.history);
            setLastUpdated(new Date());
        } catch (error) {
            toast.error('Failed to fetch payment data');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        const { id, status, note, transactionId, isSeller } = actionData;

        if (status === 'Approved' && !transactionId) {
            toast.error("Please enter a Transaction Reference for record-keeping");
            return;
        }

        try {
            let endpoint = '';
            if (actionData.isDelivery) {
                endpoint = `delivery-withdrawals/${id}`;
            } else if (isSeller) {
                endpoint = `seller-withdrawals/${id}`;
            } else {
                endpoint = `withdrawal-requests/${id}`;
            }

            await axios.put(`${API_URL}/${endpoint}`, {
                status,
                adminNote: note,
                transactionId: transactionId
            });
            toast.success(`Request ${status}`);
            setShowActionModal(false);
            setActionData({ id: '', status: '', note: '', transactionId: '', isSeller: false, isDelivery: false });
            fetchData();
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    const handleRazorpayPayment = async (request) => {
        setProcessingPayout(true);
        try {
            // 1. Create Order in Backend
            const receiptPrefix = request.isDelivery ? 'rcpt_del' : 'rcpt_slr';
            const orderRes = await axios.post(`${API_URL}/create-order`, {
                amount: request.amount,
                receipt: `${receiptPrefix}_${request._id.slice(-6)}`
            });

            if (!orderRes.data.success) throw new Error("Order creation failed");

            const { order } = orderRes.data;

            // 2. Configure Razorpay Options
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "FreshCart Admin",
                description: request.isDelivery ? `Delivery Payout for ${request.agentName}` : `Settle Payout for ${request.sellerName}`,
                order_id: order.id,
                handler: async function (response) {
                    try {
                        // 3. Confirm and Approve in Backend
                        const endpoint = request.isDelivery ? `delivery-withdrawals/${request._id}` : `seller-withdrawals/${request._id}`;
                        await axios.put(`${API_URL}/${endpoint}`, {
                            status: 'Approved',
                            transactionId: response.razorpay_payment_id,
                            adminNote: `Payout successful via Razorpay. Order: ${order.id}`
                        });
                        toast.success('Funds Transferred Successfully!');
                        setShowActionModal(false);
                        fetchData();
                    } catch (error) {
                        toast.error('Payment successful but status sync failed');
                    }
                },
                prefill: {
                    name: "FreshCart Administrator",
                    email: "admin@freshcart.com"
                },
                theme: {
                    color: "#16a34a"
                },
                modal: {
                    ondismiss: function () {
                        setProcessingPayout(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast.error(response.error.description || 'Payment Failed');
                setProcessingPayout(false);
            });
            rzp.open();

        } catch (error) {
            console.error('Razorpay Error:', error);
            toast.error(error.response?.data?.message || 'Failed to initiate Razorpay');
            setProcessingPayout(false);
        }
    };

    const viewUserHistory = async (userId) => {
        setSelectedUser(userId);
        setShowUserModal(true);
        try {
            const res = await axios.get(`${API_URL}/user-history/${userId}`);
            setUserHistory(res.data);
        } catch (error) {
            toast.error('Failed to load user history');
        }
    };

    const handleRevert = async () => {
        try {
            await axios.put(`${API_URL}/withdrawal-requests/${revertId}/revert`);
            toast.success('Request reverted');
            setShowRevertModal(false);
            setRevertId('');
            fetchData();
        } catch (error) {
            toast.error('Revert failed');
        }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`${API_URL}/withdrawal-requests/${deleteId}`);
            toast.success('Request deleted');
            setShowDeleteModal(false);
            setDeleteId('');
            fetchData();
        } catch (error) {
            toast.error('Deletion failed');
        }
    };


    const filteredRequests = requests.filter(r =>
        r.userId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredHistory = history.filter(h =>
        h.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.entity.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-800">Payments & Withdrawals</h1>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 rounded-full border border-green-200">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">Live</span>
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm">Monitor all transactions and manage payout requests • <span className="text-xs font-medium italic">Last updated: {lastUpdated.toLocaleTimeString()}</span></p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b">
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-2 px-1 font-semibold transition-colors ${activeTab === 'requests' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Grower Requests ({requests.filter(r => r.status === 'Pending').length})
                </button>
                <button
                    onClick={() => setActiveTab('seller-requests')}
                    className={`pb-2 px-1 font-semibold transition-colors ${activeTab === 'seller-requests' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Seller Payouts ({sellerRequests.filter(r => r.status === 'Pending').length})
                </button>
                <button
                    onClick={() => setActiveTab('delivery-requests')}
                    className={`pb-2 px-1 font-semibold transition-colors ${activeTab === 'delivery-requests' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Delivery Payouts ({deliveryRequests.filter(r => r.status === 'Pending').length})
                </button>
                <button
                    onClick={() => setActiveTab('purchases')}
                    className={`pb-2 px-1 font-semibold transition-colors ${activeTab === 'purchases' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Customer Purchases ({history.filter(h => h.type === 'B2C Order').length})
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-2 px-1 font-semibold transition-colors ${activeTab === 'history' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Unified History
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by ID or type..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {activeTab === 'requests' ? (
                    <table className="w-full text-left">
                        {/* Existing Grower Requests Table Body */}
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredRequests.map(r => (
                                <tr key={r._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 cursor-pointer" onClick={() => viewUserHistory(r.userId)}>
                                        <div className="font-black text-gray-900 leading-tight">{r.userName || 'Loading...'}</div>
                                        <div className="text-[10px] font-medium text-blue-600 hover:underline">{r.userId}</div>
                                    </td>
                                    <td className="px-6 py-4 font-bold">₹{r.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.status === 'Pending' ? 'bg-amber-100 text-amber-700' : r.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(r.requestDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 flex gap-2">
                                        {r.status === 'Pending' ? (
                                            <>
                                                <button onClick={() => { setActionData({ id: r._id, status: 'Approved', note: '', transactionId: '', isSeller: false }); setShowActionModal(true); }} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Approve"><CheckCircle size={18} /></button>
                                                <button onClick={() => { setActionData({ id: r._id, status: 'Rejected', note: '', transactionId: '', isSeller: false }); setShowActionModal(true); }} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Reject"><XCircle size={18} /></button>
                                            </>
                                        ) : (
                                            <button onClick={() => { setRevertId(r._id); setShowRevertModal(true); }} className="p-1 text-amber-600 hover:bg-amber-50 rounded" title="Revert to Pending">
                                                <Clock size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : activeTab === 'seller-requests' ? (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Seller</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Bank/UPI</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {sellerRequests.map(r => (
                                <tr key={r._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-black text-gray-900">{r.sellerName}</div>
                                        <div className="text-[10px] text-gray-400 uppercase font-mono">{r.sellerUniqueId || r.sellerId}</div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-green-600 text-lg">₹{r.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${r.status === 'Pending' ? 'bg-amber-100 text-amber-600' : r.status === 'Approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold">{r.bankDetails?.upiId || 'No UPI'}</div>
                                        <div className="text-[10px] text-gray-500">{r.bankDetails?.accountNumber?.slice(-4) ? `A/C ....${r.bankDetails.accountNumber.slice(-4)}` : 'Bank Details N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 flex gap-2">
                                        {r.status === 'Pending' ? (
                                            <>
                                                <button onClick={() => { setActionData({ ...r, id: r._id, isSeller: true, status: 'Approved' }); setShowActionModal(true); }} className="px-3 py-1 bg-green-600 text-white text-xs font-black rounded-lg hover:bg-green-700">PAY</button>
                                                <button onClick={() => { setActionData({ id: r._id, status: 'Rejected', note: '', isSeller: true }); setShowActionModal(true); }} className="p-1 text-red-600 hover:bg-red-50 rounded"><XCircle size={18} /></button>
                                            </>
                                        ) : (
                                            <div className="text-[10px] font-mono bg-gray-100 p-1 rounded border overflow-hidden max-w-[80px] truncate">
                                                {r.transactionId || 'PROCESSED'}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : activeTab === 'delivery-requests' ? (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Agent</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Bank/UPI</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {deliveryRequests.map(r => (
                                <tr key={r._id} className="hover:bg-gray-50">
                                    <td clain ssName="px-6 py-4">
                                        <div className="font-black text-gray-900">{r.agentName}</div>
                                        <div className="text-[10px] text-gray-400 uppercase font-mono">{r.agentId}</div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-blue-600 text-lg">₹{r.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${r.status === 'Pending' ? 'bg-amber-100 text-amber-600' : r.status === 'Approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-700'}`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold">{r.bankDetails?.upiId || 'No UPI'}</div>
                                        <div className="text-[10px] text-gray-500">{r.bankDetails?.accountNumber?.slice(-4) ? `A/C ....${r.bankDetails.accountNumber.slice(-4)}` : 'Bank Details N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 flex gap-2">
                                        {r.status === 'Pending' ? (
                                            <>
                                                <button onClick={() => { setActionData({ ...r, id: r._id, isDelivery: true, status: 'Approved' }); setShowActionModal(true); }} className="px-3 py-1 bg-green-600 text-white text-xs font-black rounded-lg hover:bg-green-700 shadow-sm shadow-green-100">PAY</button>
                                                <button onClick={() => { setActionData({ id: r._id, status: 'Rejected', note: '', isDelivery: true }); setShowActionModal(true); }} className="p-1 text-red-600 hover:bg-red-50 rounded"><XCircle size={18} /></button>
                                            </>
                                        ) : (
                                            <div className="text-[10px] font-mono bg-gray-100 p-1 rounded border overflow-hidden max-w-[80px] truncate">
                                                {r.transactionId || 'PROCESSED'}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : activeTab === 'purchases' ? (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Order ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {history.filter(h => h.type === 'B2C Order').map(h => (
                                <tr key={h.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-black text-gray-900 leading-tight">{h.userName}</div>
                                        <div className="text-[10px] text-gray-400 select-all">{h.entity}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded">#{h.orderId}</span>
                                    </td>
                                    <td className="px-6 py-4 font-black">₹{h.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${h.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {h.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(h.date).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {history.filter(h => h.type === 'B2C Order').length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No Customer Purchases Recorded</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Entity</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredHistory.map(h => (
                                <tr key={h.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold">{h.type === 'B2C Order' ? 'Customer Purchase' : h.type}</div>
                                        {h.orderId && <div className="text-[10px] text-blue-600 font-bold uppercase tracking-tight">#{h.orderId}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-600 truncate max-w-[150px]">{h.entity}</td>
                                    <td className={`px-6 py-4 font-bold ${h.type === 'Withdrawal' ? 'text-red-600' : 'text-green-600'}`}>
                                        {h.type === 'Withdrawal' ? '-' : '+'}₹{h.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 uppercase">{h.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">{new Date(h.date).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* User History Modal */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 text-green-700 rounded-lg"><User size={24} /></div>
                                <div>
                                    <h2 className="text-xl font-bold">User Financial History</h2>
                                    <p className="text-sm text-gray-500">{selectedUser}</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowUserModal(false); setUserHistory(null); }} className="text-gray-400 hover:text-gray-700 text-2xl">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {!userHistory ? (
                                <div className="flex justify-center p-12"><Clock className="animate-spin text-gray-300" size={48} /></div>
                            ) : (
                                <>
                                    <section>
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">📦 B2C Orders (Purchases)</h3>
                                        <div className="border rounded-xl overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50">
                                                    <tr><th>Date</th><th>Amount</th><th>Status</th></tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {userHistory.b2cOrders.map(o => (
                                                        <tr key={o._id}><td className="p-3">{new Date(o.createdAt).toLocaleDateString()}</td><td className="p-3 font-bold">₹{o.totalAmount}</td><td className="p-3">{o.status}</td></tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </section>
                                    <section>
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">🌿 Grower Sales (C2B)</h3>
                                        <div className="border rounded-xl overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50">
                                                    <tr><th>Date</th><th>Amount</th><th>Status</th></tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {userHistory.c2bOrders.map(o => (
                                                        <tr key={o._id}><td className="p-3">{new Date(o.createdAt).toLocaleDateString()}</td><td className="p-3 font-bold text-green-600">₹{o.agreedPrice}</td><td className="p-3">{o.paymentStatus}</td></tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </section>
                                    <section>
                                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">💸 Withdrawals</h3>
                                        <div className="border rounded-xl overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50">
                                                    <tr><th>Date</th><th>Amount</th><th>Status</th></tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {userHistory.withdrawals.map(w => (
                                                        <tr key={w._id}><td className="p-3">{new Date(w.createdAt).toLocaleDateString()}</td><td className="p-3 font-bold text-red-600">₹{w.amount}</td><td className="p-3 font-bold">{w.status}</td></tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </section>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Action Modal (Approve/Reject) */}
            {showActionModal && (
                <div className="fixed inset-0 bg-black/60 z-[110] flex justify-center items-center p-4 backdrop-blur-md">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className={`p-8 border-b flex justify-between items-center ${actionData.status === 'Approved' ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${actionData.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {actionData.status === 'Approved' ? <CheckCircle size={28} /> : <XCircle size={28} />}
                                </div>
                                <h2 className={`text-2xl font-black tracking-tight ${actionData.status === 'Approved' ? 'text-green-900' : 'text-red-900'}`}>
                                    {actionData.status === 'Approved' ? 'Approve' : 'Reject'} Request
                                </h2>
                            </div>
                            <button onClick={() => setShowActionModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <span className="text-2xl">✕</span>
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            {actionData.status === 'Approved' && (
                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Transaction Reference <span className="text-red-500">*</span></label>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="e.g. TXN987654321..."
                                        className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-green-500 focus:bg-white rounded-2xl outline-none transition-all duration-200"
                                        value={actionData.transactionId}
                                        onChange={(e) => setActionData(prev => ({ ...prev, transactionId: e.target.value }))}
                                    />
                                    <p className="text-[10px] text-gray-400 font-medium px-1">Evidence of payment for the user's records</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{actionData.status === 'Approved' ? 'Internal Note' : 'Rejection Reason'}</label>
                                <textarea
                                    placeholder={actionData.status === 'Approved' ? 'Add any relevant context...' : 'Explain why this request is being rejected...'}
                                    className={`w-full p-4 bg-gray-50 border-2 border-transparent focus:bg-white rounded-2xl outline-none min-h-[120px] transition-all duration-200
                                        ${actionData.status === 'Approved' ? 'focus:border-green-500' : 'focus:border-red-500'}`}
                                    value={actionData.note}
                                    onChange={(e) => setActionData(prev => ({ ...prev, note: e.target.value }))}
                                />
                            </div>

                            {(actionData.isSeller || actionData.isDelivery) && actionData.status === 'Approved' && (
                                <div className="p-6 bg-green-50 rounded-2xl border-2 border-green-200 space-y-4">
                                    <h4 className="font-black text-green-800 flex items-center gap-2 uppercase tracking-wide">
                                        <DollarSign size={20} /> {actionData.isDelivery ? 'Agent' : 'Seller'} Account Details
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                            <p className="text-gray-400 font-bold uppercase tracking-tighter">Holder Name</p>
                                            <p className="font-black text-gray-900">{actionData.bankDetails?.accountHolderName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 font-bold uppercase tracking-tighter">A/C Number</p>
                                            <p className="font-black text-gray-900 font-mono">{actionData.bankDetails?.accountNumber || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 font-bold uppercase tracking-tighter">IFSC</p>
                                            <p className="font-black text-gray-900 font-mono">{actionData.bankDetails?.ifscCode || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 font-bold uppercase tracking-tighter">UPI ID</p>
                                            <p className="font-black text-green-600 underline font-mono">{actionData.bankDetails?.upiId || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleRazorpayPayment(actionData)}
                                        disabled={processingPayout}
                                        className="w-full mt-4 py-3 bg-green-600 text-white rounded-xl font-black shadow-lg shadow-green-100 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        {processingPayout ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Connecting...
                                            </>
                                        ) : (
                                            <>🚀 PAY VIA RAZORPAY</>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="p-8 bg-gray-50/50 flex gap-4">
                            <button
                                onClick={() => setShowActionModal(false)}
                                className="flex-1 py-4 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Dismiss
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={actionData.status === 'Rejected' && !actionData.note}
                                className={`flex-[2] py-4 text-sm font-black text-white rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed
                                    ${actionData.status === 'Approved' ? 'bg-green-600 shadow-green-200 hover:bg-green-700' : 'bg-red-600 shadow-red-200 hover:bg-red-700'}`}
                            >
                                Process {actionData.status}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Revert Modal */}
            {showRevertModal && (
                <div className="fixed inset-0 bg-black/60 z-[110] flex justify-center items-center p-4 backdrop-blur-md">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-10 text-center">
                            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12">
                                <Clock size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Undo Action?</h3>
                            <p className="text-gray-500 mt-4 leading-relaxed">
                                This will reset the request to <span className="font-bold text-amber-600 italic">Pending</span> and erase processing logs.
                            </p>
                        </div>
                        <div className="p-8 bg-gray-50/50 flex gap-4">
                            <button onClick={() => setShowRevertModal(false)} className="flex-1 py-4 text-sm font-bold text-gray-400 hover:text-gray-600">Cancel</button>
                            <button onClick={handleRevert} className="flex-[2] py-4 text-sm font-black text-white bg-amber-500 rounded-2xl shadow-xl shadow-amber-100 active:scale-95 transition-all hover:bg-amber-600">Yes, Revert</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 z-[110] flex justify-center items-center p-4 backdrop-blur-md">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-10 text-center">
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 -rotate-12">
                                <Trash2 size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Perma-Delete?</h3>
                            <p className="text-gray-500 mt-4 leading-relaxed">
                                This will <span className="font-bold text-red-600">remove</span> this request record entirely. This action is irreversible.
                            </p>
                        </div>
                        <div className="p-8 bg-gray-50/50 flex gap-4">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 text-sm font-bold text-gray-400 hover:text-gray-600">Cancel</button>
                            <button onClick={handleDelete} className="flex-[2] py-4 text-sm font-black text-white bg-red-600 rounded-2xl shadow-xl shadow-red-100 active:scale-95 transition-all hover:bg-red-700">Delete Forever</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payments;
