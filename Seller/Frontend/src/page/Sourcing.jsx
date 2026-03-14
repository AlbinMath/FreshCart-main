import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { TrendingUp, Package, ShieldCheck } from 'lucide-react';

// Load Razorpay script on demand (no react-razorpay dependency needed)
const loadRazorpayScript = () =>
    new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

const API = 'http://localhost:5002/api/sourcing';

const categoryEmoji = {
    Vegetables: '🥬',
    Fruits: '🍎',
    Dairy: '🥛',
    Bakery: '🍞',
    'Meat & Poultry': '🍗',
};

const Sourcing = () => {
    const [activeTab, setActiveTab] = useState('feed');   // 'feed' | 'inbound'
    const [proposals, setProposals] = useState([]);
    const [inboundOrders, setInboundOrders] = useState([]);
    const [feedLoading, setFeedLoading] = useState(true);
    const [inboundLoading, setInboundLoading] = useState(false);
    const [receivingId, setReceivingId] = useState(null);
    const [paymentModal, setPaymentModal] = useState(null); // holds proposal while choosing payment
    const [performanceData, setPerformanceData] = useState(null);

    const fetchPerformance = async (sid) => {
        try {
            const res = await axios.get(`http://localhost:6002/evaluate/${sid}`);
            if (res.data.success) setPerformanceData(res.data);
        } catch (error) {
            console.error("SVM Fetch error", error);
        }
    };

    // The app stores the full seller object as 'sellerInfo' (set during login)
    const sellerInfo = JSON.parse(localStorage.getItem('sellerInfo') || '{}');
    const sellerId = sellerInfo._id || null;
    const sellerCategories = sellerInfo.productCategories || [];

    useEffect(() => {
        if (!sellerId) {
            toast.error('Seller session not found. Please login again.');
            setFeedLoading(false);
            return;
        }
        fetchProposals();
        fetchPerformance(sellerInfo.sellerUniqueId || sellerId);
    }, []);

    useEffect(() => {
        if (activeTab === 'inbound' && inboundOrders.length === 0) {
            fetchInboundOrders();
        }
    }, [activeTab]);

    // 5-second auto-refresh
    useEffect(() => {
        const interval = setInterval(() => {
            fetchProposals(true);
            if (activeTab === 'inbound') {
                fetchInboundOrders(true);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [activeTab, sellerId]);

    /* ── Feed ── */
    const fetchProposals = async (isBackground = false) => {
        if (!isBackground) setFeedLoading(true);
        try {
            const res = await axios.get(`${API}/proposals?seller_id=${sellerId}`);
            if (res.data.success) setProposals(res.data.proposals);
        } catch (error) {
            console.error(error);
            if (!isBackground) toast.error('Failed to load local produce pitches.');
        } finally {
            if (!isBackground) setFeedLoading(false);
        }
    };

    /* ── Inbound Shipments ── */
    const fetchInboundOrders = async (isBackground = false) => {
        if (!isBackground) setInboundLoading(true);
        try {
            const res = await axios.get(`${API}/orders?seller_id=${sellerId}`);
            if (res.data.success) setInboundOrders(res.data.orders);
        } catch (error) {
            console.error(error);
            if (!isBackground) toast.error('Failed to load inbound orders.');
        } finally {
            if (!isBackground) setInboundLoading(false);
        }
    };

    /* ── Claim Produce (Commitment) ── */
    const handleClaim = async (proposal) => {
        if (!sellerId) { toast.error('Seller ID not found in session.'); return; }
        setReceivingId(proposal._id);
        try {
            const res = await axios.post(`${API}/proposals/${proposal._id}/claim`, { seller_id: sellerId });
            if (res.data.success) {
                toast.success('Produce claimed! You can find it in Inbound Shipments.');
                fetchProposals();
                setActiveTab('inbound');
                fetchInboundOrders();
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Error claiming produce.');
        } finally {
            setReceivingId(null);
        }
    };

    /* ── Approval Payment Logic (Online via Razorpay) ── */
    const handleApproveOnline = async (order) => {
        try {
            // Re-use checkout endpoint to get razorpay order
            const checkoutRes = await axios.post(`${API}/proposals/${order.proposal_id}/checkout`, { seller_id: sellerId });
            if (!checkoutRes.data.success) { toast.error(checkoutRes.data.message || 'Checkout failed'); return; }

            const { order: rzpOrder } = checkoutRes.data;

            const loaded = await loadRazorpayScript();
            if (!loaded) { toast.error('Gateway load failed.'); return; }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RL7iTlLIMH8nZY',
                amount: rzpOrder.amount,
                currency: rzpOrder.currency,
                name: 'FreshCart C2B Final Payment',
                description: `Approving & Paying for ${order.proposalTitle}`,
                order_id: rzpOrder.id,
                handler: async (response) => {
                    try {
                        const res = await axios.put(`${API}/orders/${order._id}/receive`, {
                            status: 'Approved',
                            paymentMethod: 'Online',
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id
                        });
                        if (res.data.success) {
                            toast.success('✅ Payment Successful & Produce Approved!');
                            fetchInboundOrders();
                        }
                    } catch (err) {
                        console.error(err);
                        toast.error('Error verifying payment.');
                    }
                },
                prefill: { name: 'FreshCart Seller', email: 'seller@freshcart.com', contact: '9999999999' },
                theme: { color: '#16a34a' },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error(error);
            toast.error('Error initiating final payment.');
        }
    };

    /* ── Approval Payment Logic (Offline) ── */
    const handleApproveOffline = async (order) => {
        setReceivingId(order._id);
        try {
            const res = await axios.put(`${API}/orders/${order._id}/receive`, {
                status: 'Approved',
                paymentMethod: 'Offline'
            });
            if (res.data.success) {
                toast.success('✅ Produce approved via Offline Payment!');
                fetchInboundOrders();
            }
        } catch (err) {
            console.error(err);
            toast.error('Error approving order.');
        } finally {
            setReceivingId(null);
        }
    };

    /* ── Mark Received / Approve or Reject ── */
    const handleReceive = async (order, status) => {
        if (status === 'Approved') {
            // Open modal to choose payment method for approval
            setPaymentModal({ ...order, isApprovalStep: true });
            return;
        }

        setReceivingId(order._id);
        try {
            const res = await axios.put(`${API}/orders/${order._id}/receive`, { status });
            if (res.data.success) {
                toast.success('❌ Produce rejected. Order updated.');
                fetchInboundOrders();
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Error updating order.');
        } finally {
            setReceivingId(null);
        }
    };

    /* ── Status badge helpers ── */
    const shippingBadge = (s) => {
        const map = {
            'Pending Drop-off': 'bg-yellow-100 text-yellow-700',
            'In Transit': 'bg-blue-100 text-blue-700',
            'Delivered': 'bg-green-100 text-green-700',
        };
        return `text-xs px-2 py-0.5 rounded-full font-medium ${map[s] || 'bg-gray-100 text-gray-600'}`;
    };

    const paymentBadge = (s) => {
        const map = {
            'Escrow Held': 'bg-orange-100 text-orange-700',
            'Released to Customer': 'bg-green-100 text-green-700',
            'Refunded': 'bg-red-100 text-red-700',
            'Acquired - Pending Payment': 'bg-blue-100 text-blue-700',
            'Offline - Cash Payment': 'bg-purple-100 text-purple-700',
        };
        return `text-xs px-2 py-0.5 rounded-full font-medium ${map[s] || 'bg-gray-100 text-gray-600'}`;
    };

    /* ── RENDER ── */
    return (
        <>
            <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">

            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-400">
                        Source Local Produce
                    </h2>
                    <p className="text-gray-600 mt-1">Browse pitches from local growers matching your store's categories.</p>
                </div>

                {performanceData?.success && (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-green-100">
                        <div className={`p-2 rounded-lg ${
                            performanceData.tier === 'Excellent' ? 'bg-green-50 text-green-600' : 
                            performanceData.tier === 'Good' ? 'bg-blue-50 text-blue-600' : 
                            performanceData.tier === 'Average' ? 'bg-yellow-50 text-yellow-600' : 
                            performanceData.tier === 'New Seller' ? 'bg-gray-50 text-gray-400' : 'bg-red-50 text-red-600'
                        }`}>
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase">Performance</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    performanceData.tier === 'Excellent' ? 'bg-green-100 text-green-700' : 
                                    performanceData.tier === 'Good' ? 'bg-blue-100 text-blue-700' : 
                                    performanceData.tier === 'Average' ? 'bg-yellow-100 text-yellow-700' : 
                                    performanceData.tier === 'New Seller' ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-700'
                                }`}>
                                    {performanceData.tier}
                                </span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5">
                                <span className="text-sm font-bold text-gray-800">{((performanceData.confidence || 0) * 100).toFixed(0)}% Confidence</span>
                                <span className="text-[10px] text-gray-400 font-medium flex items-center gap-0.5">
                                    <ShieldCheck className="h-2.5 w-2.5" /> AI Verified
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveTab('feed')}
                    className={`px-5 py-2 rounded-lg font-medium text-sm transition ${activeTab === 'feed'
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
                >
                    🌱 Produce Feed
                </button>
                <button
                    onClick={() => setActiveTab('inbound')}
                    className={`px-5 py-2 rounded-lg font-medium text-sm transition ${activeTab === 'inbound'
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
                >
                    📦 Inbound Shipments
                </button>
            </div>

            {/* Warning: no categories set */}
            {sellerCategories.length === 0 && activeTab === 'feed' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-5 flex items-start gap-3">
                    <span className="text-yellow-500 text-lg mt-0.5">⚠️</span>
                    <div>
                        <p className="text-sm font-semibold text-yellow-800">Your store has no product categories set</p>
                        <p className="text-xs text-yellow-700 mt-0.5">
                            Showing all available pitches. Go to{' '}
                            <a href="/settings" className="underline font-medium">Store Settings</a>{' '}
                            to add categories so the feed only shows matching produce.
                        </p>
                    </div>
                </div>
            )}

            {sellerCategories.length > 0 && activeTab === 'feed' && (
                <div className="flex flex-wrap gap-2 mb-5">
                    <span className="text-xs text-gray-500 self-center">Filtered by:</span>
                    {sellerCategories.map(cat => (
                        <span key={cat} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            {categoryEmoji[cat] || '•'} {cat}
                        </span>
                    ))}
                </div>
            )}

            {/* ─── TAB: PRODUCE FEED ─── */}
            {activeTab === 'feed' && (
                feedLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                ) : proposals.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 flex flex-col items-center justify-center text-center">
                        <div className="bg-green-100 p-4 rounded-full mb-4 text-4xl">🌱</div>
                        <h3 className="text-xl font-bold text-gray-800">No new pitches right now</h3>
                        <p className="text-gray-500 mt-2 max-w-md">
                            There are no fresh produce pitches from local growers that match your store's categories. Check back later!
                        </p>
                        <button onClick={fetchProposals} className="mt-4 text-sm text-green-600 hover:underline">
                            Refresh
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {proposals.map((proposal) => (
                            <div key={proposal._id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col">
                                {/* Produce Image Placeholder — category themed or actual image */}
                                <div className={`h-44 flex flex-col items-center justify-center border-b border-gray-100 relative overflow-hidden
                                    ${proposal.images && proposal.images.length > 0 ? '' : 
                                      proposal.category?.toLowerCase().includes('fruit') ? 'bg-gradient-to-br from-orange-50 to-pink-100' :
                                      proposal.category?.toLowerCase().includes('veg')   ? 'bg-gradient-to-br from-green-50 to-emerald-100' :
                                      proposal.category?.toLowerCase().includes('dairy') ? 'bg-gradient-to-br from-blue-50 to-sky-100' :
                                      proposal.category?.toLowerCase().includes('meat')  ? 'bg-gradient-to-br from-red-50 to-rose-100' :
                                      proposal.category?.toLowerCase().includes('bak')   ? 'bg-gradient-to-br from-yellow-50 to-amber-100' :
                                      'bg-gradient-to-br from-gray-50 to-slate-100'}`}
                                >
                                    {proposal.images && proposal.images.length > 0 ? (
                                        <img src={proposal.images[0]} alt={proposal.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <span className="text-6xl drop-shadow-sm select-none">
                                                {categoryEmoji[proposal.category] || '🌿'}
                                            </span>
                                            <span className="text-xs font-medium text-gray-400 mt-2 uppercase tracking-widest">
                                                {proposal.category}
                                            </span>
                                        </>
                                    )}
                                    
                                    {/* Freshness Date Badge */}
                                    {proposal.harvestDate && (
                                        <span className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm border border-green-100">
                                            🌾 {new Date(proposal.harvestDate).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                                        </span>
                                    )}
                                </div>

                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-base text-gray-800 line-clamp-1">{proposal.title}</h3>
                                        <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ml-2">
                                            {proposal.category}
                                        </span>
                                    </div>
                                    <p className="text-gray-500 text-xs line-clamp-2 mb-3 flex-1">{proposal.description || 'No description provided.'}</p>

                                    <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs divide-y divide-gray-100">
                                        <div className="flex justify-between pb-1.5">
                                            <span className="text-gray-500">Available</span>
                                            <span className="font-semibold text-gray-800">
                                                {proposal.quantityAvailable} {proposal.quantityUnit || 'kg'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-1.5">
                                            <span className="text-gray-500">Total Price</span>
                                            <span className="font-bold text-green-600">
                                                ₹{Number(proposal.askingPrice).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-1.5">
                                            <span className="text-gray-500">Per {proposal.quantityUnit || 'kg'}</span>
                                            <span className="font-medium text-gray-600">
                                                ₹{(proposal.quantityAvailable > 0
                                                    ? (proposal.askingPrice / proposal.quantityAvailable).toFixed(2)
                                                    : 0)}
                                            </span>
                                        </div>
                                        {proposal.harvestDate && (
                                            <div className="flex justify-between pt-1.5">
                                                <span className="text-gray-500">Harvested</span>
                                                <span className="font-medium text-gray-800">
                                                    {new Date(proposal.harvestDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        disabled={receivingId === proposal._id}
                                        onClick={() => handleClaim(proposal)}
                                        className="w-full bg-green-600 hover:bg-green-700 active:scale-95 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition text-sm flex items-center justify-center gap-2"
                                    >
                                        {receivingId === proposal._id ? 'Claiming...' : `🛒 Acquire — ₹${Number(proposal.askingPrice).toLocaleString()}`}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* ─── TAB: INBOUND SHIPMENTS ─── */}
            {activeTab === 'inbound' && (
                inboundLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                ) : inboundOrders.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 flex flex-col items-center justify-center text-center">
                        <div className="text-5xl mb-4">📦</div>
                        <h3 className="text-xl font-bold text-gray-800">No inbound shipments yet</h3>
                        <p className="text-gray-500 mt-2">Once you acquire produce from a grower, it will appear here.</p>
                        <button onClick={fetchInboundOrders} className="mt-4 text-sm text-green-600 hover:underline">
                            Refresh
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {inboundOrders.map((order) => (
                            <div key={order._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">

                                    {/* Order Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-gray-800">C2B Order #{order.c2bOrderId}</h3>
                                        </div>
                                        {/* Produce name */}
                                        {order.proposalTitle && (
                                            <p className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
                                                <span>&#127807;</span> {order.proposalTitle}
                                            </p>
                                        )}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-sm">
                                            <div>
                                                <span className="text-gray-500">Qty:</span>{' '}
                                                <span className="font-medium text-gray-800">
                                                    {order.quantity} <span className="text-gray-500 text-xs">{order.quantityUnit || 'kg'}</span>
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Agreed Price:</span>{' '}
                                                <span className="font-bold text-green-600">₹{order.agreedPrice}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Grower ID:</span>{' '}
                                                <span className="font-medium text-gray-700 text-xs">{order.customer_id?.substring(0, 10)}…</span>
                                            </div>
                                        </div>

                                        {/* Grower Details */}
                                        {order.growerName && (
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Grower Contact</p>
                                                <p className="font-semibold text-gray-800">{order.growerName}</p>
                                                {order.growerPhone && (
                                                    <p className="text-sm text-gray-600 mt-0.5">
                                                        <span className="font-medium">Phone:</span> {order.growerPhone}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex gap-2 mt-3 flex-wrap">
                                            <span className={shippingBadge(order.shippingStatus)}>{order.shippingStatus}</span>
                                            <span className={paymentBadge(order.paymentStatus)}>{order.paymentStatus}</span>
                                            {order.inspectionStatus && order.inspectionStatus !== 'Pending' && (
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.inspectionStatus === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    Inspection: {order.inspectionStatus}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Approve / Reject — only when not yet resolved */}
                                    {order.paymentStatus === 'Acquired - Pending Payment' &&
                                     (!order.inspectionStatus || order.inspectionStatus === 'Pending') && (
                                        <div className="flex gap-2 sm:flex-col sm:min-w-[140px]">
                                            <button
                                                disabled={receivingId === order._id}
                                                onClick={() => handleReceive(order, 'Approved')}
                                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium py-2 px-4 rounded-lg transition"
                                            >
                                                ✅ Approve
                                            </button>
                                            <button
                                                disabled={receivingId === order._id}
                                                onClick={() => handleReceive(order, 'Rejected')}
                                                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-medium py-2 px-4 rounded-lg transition"
                                            >
                                                ❌ Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>

        {/* ── Payment Method Selection Modal ── */}
        {paymentModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-4 text-white">
                        <h3 className="text-lg font-bold">Approve & Pay</h3>
                        <p className="text-green-100 text-sm mt-0.5 line-clamp-1">
                            {paymentModal.proposalTitle || paymentModal.title} &mdash; ₹{Number(paymentModal.agreedPrice || paymentModal.askingPrice).toLocaleString()}
                        </p>
                    </div>

                    {/* Options */}
                    <div className="p-5 space-y-3">
                        {/* Online */}
                        <button
                            onClick={() => { setPaymentModal(null); handleApproveOnline(paymentModal); }}
                            className="w-full flex items-center gap-4 p-4 border-2 border-blue-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl transition group text-left"
                        >
                            <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 text-2xl transition">
                                &#128179;
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 text-sm">Online Payment</p>
                                <p className="text-xs text-gray-500 mt-0.5">Pay securely via Razorpay (UPI, Card, Net Banking)</p>
                                <span className="inline-block mt-1 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">Wallet Transfer</span>
                            </div>
                        </button>

                        {/* Offline */}
                        <button
                            onClick={() => { setPaymentModal(null); handleApproveOffline(paymentModal); }}
                            className="w-full flex items-center gap-4 p-4 border-2 border-orange-200 hover:border-orange-500 hover:bg-orange-50 rounded-xl transition group text-left"
                        >
                            <div className="w-12 h-12 bg-orange-100 group-hover:bg-orange-200 rounded-full flex items-center justify-center flex-shrink-0 text-2xl transition">
                                &#128181;
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 text-sm">Offline / Cash Payment</p>
                                <p className="text-xs text-gray-500 mt-0.5">Pay directly to the grower in cash or via bank transfer</p>
                                <span className="inline-block mt-1 text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">Manual Settlement</span>
                            </div>
                        </button>
                    </div>

                    {/* Cancel */}
                    <div className="px-5 pb-5">
                        <button
                            onClick={() => setPaymentModal(null)}
                            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default Sourcing;
