import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const EMPTY_FORM = {
    title: '',
    description: '',
    category: 'Vegetables',
    quantityAvailable: '',
    quantityUnit: 'kg',
    askingPrice: '',
    harvestDate: '',
    images: []
};

const categoryEmoji = {
    Vegetables: '🥬',
    Fruits: '🍎',
    Dairy: '🥛',
    Bakery: '🍞',
    'Meat & Poultry': '🍗',
};


export default function GrowerPortal() {
    const { currentUser } = useAuth();
    const [proposals, setProposals] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [earnings, setEarnings] = useState({ totalEarned: 0, totalWithdrawn: 0, availableBalance: 0, totalPending: 0 });
    const [withdrawals, setWithdrawals] = useState([]);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawalAmount, setWithdrawalAmount] = useState('');

    // null  → create mode | proposal object → edit mode
    const [editingProposal, setEditingProposal] = useState(null);

    const [formData, setFormData] = useState(EMPTY_FORM);
    const [uploadingImage, setUploadingImage] = useState(false);

    useEffect(() => {
        if (currentUser) {
            fetchData();
            
            const interval = setInterval(() => {
                fetchData(true);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [currentUser]);

    const fetchData = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        try {
            const [propRes, ordRes, earnRes, withRes] = await Promise.all([
                axios.get(`http://localhost:5001/api/grower/proposals/${currentUser.uid}`),
                axios.get(`http://localhost:5001/api/grower/orders/${currentUser.uid}`),
                axios.get(`http://localhost:5001/api/grower/earnings/${currentUser.uid}`),
                axios.get(`http://localhost:5001/api/grower/withdrawals/${currentUser.uid}`)
            ]);
            setProposals(propRes.data.proposals);
            setOrders(ordRes.data.orders);
            setEarnings(earnRes.data.earnings);
            setWithdrawals(withRes.data.withdrawals);
        } catch (err) {
            console.error(err);
            if (!isBackground) toast.error('Failed to load portal data');
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /* ── Open modal in CREATE mode ── */
    const openCreateModal = () => {
        setEditingProposal(null);
        setFormData(EMPTY_FORM);
        setShowModal(true);
    };

    /* ── Open modal in EDIT mode ── */
    const openEditModal = (proposal) => {
        setEditingProposal(proposal);
        setFormData({
            title: proposal.title || '',
            description: proposal.description || '',
            category: proposal.category || 'Vegetables',
            quantityAvailable: proposal.quantityAvailable?.toString() || '',
            quantityUnit: proposal.quantityUnit || 'kg',
            askingPrice: proposal.askingPrice?.toString() || '',
            harvestDate: proposal.harvestDate
                ? new Date(proposal.harvestDate).toISOString().split('T')[0]
                : '',
            images: proposal.images || []
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProposal(null);
        setFormData(EMPTY_FORM);
    };

    /* ── Submit: branch on create vs edit ── */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingProposal) {
            await handleUpdate();
        } else {
            await handleCreate();
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Simple validation
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        setUploadingImage(true);
        const uploadToast = toast.loading('Uploading produce image...');
        const imageFormData = new FormData();
        imageFormData.append('image', file);

        try {
            const res = await axios.post('http://localhost:5001/api/grower/upload-image', imageFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                setFormData(prev => ({ ...prev, images: [res.data.imageUrl] }));
                toast.success('Image uploaded successfully!', { id: uploadToast });
            }
        } catch (err) {
            console.error('Image upload failed:', err);
            toast.error('Failed to upload image', { id: uploadToast });
        } finally {
            setUploadingImage(false);
            e.target.value = ''; // Reset input
        }
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({ ...prev, images: [] }));
        toast.success('Image removed');
    };

    const handleCreate = async () => {
        try {
            const payload = {
                ...formData,
                customer_id: currentUser.uid,
                quantityAvailable: Number(formData.quantityAvailable),
                askingPrice: Number(formData.askingPrice)
            };
            const res = await axios.post('http://localhost:5001/api/grower/proposals', payload);
            if (res.data.success) {
                toast.success('Proposal submitted successfully!');
                closeModal();
                fetchData();
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Error submitting proposal');
        }
    };
    const handleUpdate = async () => {
        try {
            const payload = {
                ...formData,
                quantityAvailable: Number(formData.quantityAvailable),
                askingPrice: Number(formData.askingPrice)
            };
            const res = await axios.put(
                `http://localhost:5001/api/grower/proposals/${editingProposal._id}`,
                payload
            );
            if (res.data.success) {
                toast.success('Proposal updated successfully!');
                closeModal();
                fetchData();
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Error updating proposal');
        }
    };

    const handleDeleteProposal = async (id) => {
        if (!window.confirm('Are you sure you want to delete this proposal? This action cannot be undone.')) {
            return;
        }

        try {
            const res = await axios.delete(`http://localhost:5001/api/grower/proposals/${id}`);
            if (res.data.success) {
                toast.success('Proposal deleted successfully!');
                fetchData();
            }
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Error deleting proposal');
        }
    };

    const handleWithdrawal = async (e) => {
        e.preventDefault();
        if (Number(withdrawalAmount) > earnings.availableBalance) {
            toast.error('Insufficient balance');
            return;
        }

        try {
            const res = await axios.post('http://localhost:5001/api/grower/withdraw', {
                userId: currentUser.uid,
                amount: Number(withdrawalAmount)
            });
            if (res.data.success) {
                toast.success('Withdrawal request submitted!');
                setShowWithdrawModal(false);
                setWithdrawalAmount('');
                fetchData();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Withdrawal failed');
        }
    };

    const handleCancelWithdrawal = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this withdrawal request?')) return;
        try {
            const res = await axios.delete(`http://localhost:5001/api/grower/withdraw/${id}`);
            if (res.data.success) {
                toast.success('Request cancelled');
                fetchData();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Cancellation failed');
        }
    };



    if (loading) return <div className="p-8 text-center text-gray-500">Loading your Grower Portal...</div>;

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-100 mb-8 pt-10 pb-8 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-green-600 text-white p-1.5 rounded-lg shadow-green-200 shadow-lg">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                                </span>
                                <h1 className="text-3xl font-black tracking-tight text-gray-900">
                                    Grower <span className="text-green-600">Portal</span>
                                </h1>
                            </div>
                            <p className="text-gray-500 font-medium">Manage your produce pitches and track your earnings.</p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="group flex items-center gap-2 bg-gray-900 hover:bg-black text-white font-bold py-3.5 px-8 rounded-2xl transition-all shadow-xl shadow-gray-200 active:scale-95"
                        >
                            <span className="text-xl transition-transform group-hover:rotate-90">+</span>
                            Pitch New Produce
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar Column: Earnings & History */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Available Balance Card */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                    </span>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Liquid Cash</span>
                                </div>
                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-tight mb-1">Available Balance</p>
                                <h3 className="text-2xl font-black text-gray-900 leading-none">₹{earnings.availableBalance.toLocaleString()}</h3>
                            </div>
                            <button 
                                onClick={() => {
                                    setWithdrawalAmount(earnings.availableBalance.toString());
                                    setShowWithdrawModal(true);
                                }}
                                disabled={earnings.availableBalance <= 0}
                                className="mt-6 w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-100 disabled:text-gray-400 text-white text-xs font-black py-3 rounded-xl transition-all shadow-lg shadow-green-100 active:scale-95"
                            >
                                Withdraw Now
                            </button>
                        </div>

                        {/* Pending Payouts Card */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                </span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">In Pipeline</span>
                            </div>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-tight mb-1">Pending Payouts</p>
                            <h3 className="text-2xl font-black text-blue-600 leading-none">₹{earnings.totalPending.toLocaleString()}</h3>
                            <p className="text-[9px] text-gray-400 font-bold mt-3 uppercase tracking-tighter">Awaiting verification</p>
                        </div>

                        {/* Lifetime Earnings Card */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30">
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-emerald-600 text-white p-2 rounded-xl shadow-lg shadow-emerald-100">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                                </span>
                                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest">Milestone</span>
                            </div>
                            <p className="text-emerald-800/60 text-[10px] font-bold uppercase tracking-tight mb-1">Lifetime Earnings</p>
                            <h3 className="text-2xl font-black text-emerald-700 leading-none">₹{earnings.totalEarned.toLocaleString()}</h3>
                            <p className="text-[9px] text-emerald-600/50 font-bold mt-3 uppercase tracking-tighter">Total wealth generated</p>
                        </div>

                        {/* Payout History */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-lg font-black text-gray-800 mb-6 flex items-center">
                                <span className="bg-amber-100 p-2 rounded-xl mr-3">🕒</span>
                                Payout History
                            </h2>
                            {withdrawals.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                                    <p className="text-gray-400 text-[11px] italic">No requests yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {withdrawals.map(w => (
                                        <div key={w._id} className="group relative flex flex-col p-3 border border-gray-50 rounded-2xl bg-gray-50/50 hover:bg-white hover:shadow-md transition-all duration-300">
                                            <div className="flex justify-between items-center w-full">
                                                <div>
                                                    <p className="font-black text-gray-900 text-base leading-tight">₹{w.amount.toLocaleString()}</p>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">{new Date(w.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[8px] px-2 py-0.5 rounded-lg font-black uppercase tracking-widest shadow-sm ${
                                                        w.status === 'Pending' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                        w.status === 'Approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                        'bg-red-100 text-red-700 border border-red-200'
                                                    }`}>
                                                        {w.status}
                                                    </span>
                                                    {w.status === 'Pending' && (
                                                        <button 
                                                            onClick={() => handleCancelWithdrawal(w._id)}
                                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all active:scale-95"
                                                            title="Cancel Request"
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            {w.status === 'Approved' && w.transactionId && (
                                                <div className="mt-2 pt-2 border-t border-gray-100/50">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Bank Ref ID:</span>
                                                        <span className="text-[10px] font-black text-gray-600 bg-white px-2 py-0.5 rounded-md border border-gray-100 shadow-sm font-mono">{w.transactionId}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content: Proposals & Orders */}
                    <div className="lg:col-span-9 flex flex-col gap-8">
                        {/* Proposals Section */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                    <span className="bg-emerald-100 p-2.5 rounded-xl mr-3">🌱</span>
                                    Your Produce Proposals
                                </h2>
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{proposals.length} Items</span>
                            </div>
                            {proposals.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                                    <p className="text-gray-400 italic">No active proposals yet.</p>
                                    <button onClick={openCreateModal} className="mt-4 text-green-600 font-bold hover:underline">Pitch your first produce →</button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-5">
                                    {proposals.map((p) => (
                                        <div key={p._id} className="group flex flex-col sm:flex-row border border-gray-100 rounded-2xl hover:shadow-xl hover:border-green-100 transition-all duration-300 overflow-hidden bg-white">
                                            {/* Image Section */}
                                            <div className={`relative w-full sm:w-40 h-40 sm:h-auto flex-shrink-0 flex items-center justify-center border-b sm:border-b-0 sm:border-r border-gray-50
                                                ${p.images && p.images.length > 0 ? '' : 
                                                p.category?.toLowerCase().includes('fruit') ? 'bg-gradient-to-br from-orange-50 to-pink-100' :
                                                p.category?.toLowerCase().includes('veg')   ? 'bg-gradient-to-br from-green-50 to-emerald-100' :
                                                p.category?.toLowerCase().includes('dairy') ? 'bg-gradient-to-br from-blue-50 to-sky-100' :
                                                p.category?.toLowerCase().includes('meat')  ? 'bg-gradient-to-br from-red-50 to-rose-100' :
                                                p.category?.toLowerCase().includes('bak')   ? 'bg-gradient-to-br from-yellow-50 to-amber-100' :
                                                'bg-gradient-to-br from-gray-50 to-slate-100'}`}
                                            >
                                                {p.images && p.images.length > 0 ? (
                                                    <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                ) : (
                                                    <span className="text-5xl drop-shadow-sm select-none transition-transform duration-300 group-hover:scale-125">
                                                        {categoryEmoji[p.category] || '🌿'}
                                                    </span>
                                                )}
                                                <div className="absolute top-2 left-2">
                                                    <span className="px-2 py-1 bg-white/90 backdrop-blur-sm shadow-sm rounded-lg text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                                                        {p.category}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Content Section */}
                                            <div className="flex-1 p-5 flex flex-col justify-between">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-green-700 transition-colors">{p.title}</h3>
                                                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{p.description || 'No description provided.'}</p>
                                                        
                                                        <div className="mt-4 flex flex-wrap gap-3">
                                                            <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter mr-2">Quantity</span>
                                                                <span className="text-sm font-bold text-gray-700">{p.quantityAvailable} {p.quantityUnit || 'kg'}</span>
                                                            </div>
                                                            <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter mr-2">Harvest</span>
                                                                <span className="text-sm font-bold text-gray-700">{p.harvestDate ? new Date(p.harvestDate).toLocaleDateString() : 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right shrink-0">
                                                        <div className="bg-green-50 px-4 py-2 rounded-2xl border border-green-100">
                                                            <p className="text-green-700 font-black text-xl">₹{Number(p.askingPrice).toLocaleString()}</p>
                                                            <p className="text-[10px] text-green-600/70 font-bold tracking-widest uppercase text-center">Price</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-5 pt-4 border-t border-gray-50 flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`h-2.5 w-2.5 rounded-full animate-pulse
                                                            ${p.status === 'Pending' ? 'bg-amber-400' : p.status === 'Accepted' ? 'bg-green-500' : 'bg-gray-400'}`}
                                                        ></span>
                                                        <span className={`text-xs font-bold uppercase tracking-widest ${
                                                            p.status === 'Pending' ? 'text-amber-600' :
                                                            p.status === 'Accepted' ? 'text-green-600' :
                                                            'text-gray-500'
                                                        }`}>
                                                            {p.status}
                                                        </span>
                                                    </div>

                                                    {p.status !== 'Accepted' && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => openEditModal(p)}
                                                                className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all active:scale-95"
                                                            >
                                                                <span>✏️</span> Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteProposal(p._id)}
                                                                className="flex items-center gap-2 text-xs font-bold text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition-all active:scale-95"
                                                            >
                                                                <span>🗑️</span> Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Active C2B Orders */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                                <span className="bg-blue-100 p-2.5 rounded-xl mr-3">📦</span>
                                Acquired by Sellers
                            </h2>
                            {orders.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                                    <p className="text-gray-400 italic">No orders yet.</p>
                                    <p className="text-xs text-gray-400 mt-1">Sellers will see your proposals in their feed.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6">
                                    {orders.map(o => (
                                        <div key={o._id} className="p-6 border border-emerald-100 bg-emerald-50/30 rounded-2xl hover:bg-emerald-50 transition-colors">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-100 px-2 py-1 rounded-lg">Order Active</span>
                                                    <h3 className="font-bold text-gray-800 text-lg mt-2 flex items-center gap-2">
                                                        {o.proposal_id?.title || o.proposalTitle}
                                                        <span className="text-xs font-normal text-gray-400">#{o.c2bOrderId || o._id.substring(0, 6)}</span>
                                                    </h3>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-emerald-700">₹{o.agreedPrice}</p>
                                                    <p className="text-[10px] text-emerald-600/60 font-bold uppercase tracking-widest">Total Value</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="bg-white p-3 rounded-xl border border-emerald-50 shadow-sm">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Quantity Sold</p>
                                                    <p className="text-sm font-bold text-gray-800">{o.quantity} {o.quantityUnit || o.proposal_id?.quantityUnit || 'kg'}</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border border-emerald-50 shadow-sm">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Shipping Status</p>
                                                    <p className="text-sm font-bold text-blue-600 uppercase tracking-tight">{o.shippingStatus}</p>
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                <p className={`text-xs px-3 py-2 rounded-xl font-bold border flex items-center gap-2
                                                    ${o.paymentStatus === 'Acquired - Pending Payment' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                    o.paymentStatus.includes('Offline') ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                    'bg-green-50 text-green-700 border-green-100'}`}>
                                                    <span className="text-sm">💳</span>
                                                    Payment: {o.paymentStatus === 'Acquired - Pending Payment' ? 'Awaiting Verification' : o.paymentStatus}
                                                </p>
                                            </div>

                                            {/* Seller Contact & Delivery Details */}
                                            {o.sellerStoreName && (
                                                <div className="pt-5 border-t border-emerald-100">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <p className="text-[11px] font-black text-emerald-800 uppercase tracking-tighter">Delivery Details</p>
                                                        {o.sellerPhone && (
                                                            <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                                                📞 {o.sellerPhone}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="bg-white/80 p-4 rounded-xl border border-emerald-50">
                                                        <p className="font-bold text-gray-800">{o.sellerStoreName}</p>
                                                        <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{o.sellerAddress}</p>
                                                        
                                                        {o.paymentStatus === 'Offline - Cash Payment' && (
                                                            <div className="mt-4 bg-orange-100/50 text-orange-800 text-xs px-3 py-2.5 rounded-xl border border-orange-200 flex items-center gap-2">
                                                                <span className="text-lg">💰</span>
                                                                <span className="font-semibold">Collect <span className="text-sm">₹{Number(o.agreedPrice).toLocaleString()}</span> from seller upon delivery.</span>
                                                            </div>
                                                        )}

                                                        {o.paymentStatus === 'Acquired - Pending Payment' && (
                                                            <div className="mt-4 flex items-start gap-3 bg-blue-50 p-3 rounded-xl border border-blue-100">
                                                                <span className="text-lg">📝</span>
                                                                <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                                                                    Deliver produce to this address. Once inspected and approved, payment will be released.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            {/* Modal — shared between Create and Edit modes */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    {editingProposal ? '✏️ Edit Proposal' : 'Pitch Fresh Produce'}
                                </h2>
                                {editingProposal && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Editing: <span className="font-medium">{editingProposal.title}</span>
                                    </p>
                                )}
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    required
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                                    placeholder="e.g. Fresh Organic Tomatoes"
                                />
                            </div>

                            {/* Image Upload Field */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Produce Image</label>
                                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 transition-all hover:border-green-400">
                                    <div className={`relative w-24 h-24 shrink-0 rounded-xl border-2 overflow-hidden bg-white shadow-sm flex items-center justify-center ${uploadingImage ? 'border-gray-200' : 'border-green-100'}`}>
                                        {uploadingImage ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-600 border-t-transparent"></div>
                                                <span className="text-[10px] text-gray-500 font-medium">Uploading</span>
                                            </div>
                                        ) : formData.images && formData.images.length > 0 ? (
                                            <>
                                                <img src={formData.images[0]} alt="Preview" className="w-full h-full object-cover" />
                                                <button 
                                                    type="button"
                                                    onClick={handleRemoveImage}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-transform active:scale-95"
                                                    title="Remove image"
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center text-gray-400">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                                <span className="text-[10px] font-medium text-center px-1 leading-tight">No Image<br/>Uploaded</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 w-full sm:w-auto">
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={uploadingImage}
                                                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                                id="image-upload-input"
                                            />
                                            <label 
                                                htmlFor="image-upload-input"
                                                className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg border border-green-600 text-green-700 font-semibold text-sm transition-all
                                                    ${uploadingImage ? 'opacity-50' : 'hover:bg-green-600 hover:text-white group-hover:shadow-md cursor-pointer active:scale-[0.98]'}`}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                                {formData.images?.length > 0 ? 'Change Photo' : 'Choose Photo'}
                                            </label>
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-2 italic leading-tight">Max size 5MB. Clear daylight photos work best!</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                                    >
                                        <option value="Vegetables">Vegetables</option>
                                        <option value="Fruits">Fruits</option>
                                        <option value="Dairy">Dairy</option>
                                        <option value="Bakery">Bakery</option>
                                        <option value="Meat & Poultry">Meat &amp; Poultry</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Harvest Date</label>
                                    <input
                                        type="date"
                                        name="harvestDate"
                                        value={formData.harvestDate}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity</label>
                                    <div className="flex border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-400">
                                        <input
                                            required
                                            type="number"
                                            name="quantityAvailable"
                                            value={formData.quantityAvailable}
                                            onChange={handleInputChange}
                                            className="flex-1 p-2 outline-none min-w-0"
                                            placeholder="e.g. 50"
                                        />
                                        <select
                                            name="quantityUnit"
                                            value={formData.quantityUnit}
                                            onChange={handleInputChange}
                                            className="bg-gray-100 border-l px-2 text-sm text-gray-700 outline-none cursor-pointer hover:bg-gray-200 transition"
                                        >
                                            <option value="kg">kg</option>
                                            <option value="units">units</option>
                                            <option value="litres">litres</option>
                                            <option value="dozens">dozens</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Asking Price (₹)</label>
                                    <input
                                        required
                                        type="number"
                                        name="askingPrice"
                                        value={formData.askingPrice}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows="3"
                                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                                    placeholder="Describe the freshness, farming method, etc."
                                />
                            </div>

                            <div className="pt-4 flex gap-3 justify-end border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={`px-6 py-2 text-white font-semibold rounded-lg shadow-sm transition ${
                                        editingProposal
                                            ? 'bg-blue-600 hover:bg-blue-700'
                                            : 'bg-green-600 hover:bg-green-700'
                                    }`}
                                >
                                    {editingProposal ? 'Save Changes' : 'Submit Pitch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Withdrawal Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Withdraw Balance</h2>
                            <button onClick={() => setShowWithdrawModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <form onSubmit={handleWithdrawal} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                                <input
                                    required
                                    type="number"
                                    max={earnings.availableBalance}
                                    value={withdrawalAmount}
                                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-400"
                                />
                                <p className="text-[10px] text-gray-500 mt-1">Available: ₹{earnings.availableBalance.toLocaleString()}</p>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg transition"
                            >
                                Confirm Withdrawal
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
