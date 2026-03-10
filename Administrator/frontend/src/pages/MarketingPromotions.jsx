import React, { useState, useEffect } from 'react';
import { Tag, Clock, Package, Plus, Trash2, Calendar, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const MarketingPromotions = () => {
    const [activeTab, setActiveTab] = useState('coupons');

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Marketing & Promotions</h1>
                    <p className="text-gray-500 mt-1">Manage coupons, flash sales, and product bundles</p>
                </div>

                <div className="flex p-1 bg-gray-100 rounded-lg">
                    <button
                        onClick={() => setActiveTab('coupons')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'coupons'
                            ? 'bg-white text-green-700 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Tag size={18} />
                        Coupons
                    </button>
                    <button
                        onClick={() => setActiveTab('flash-sales')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'flash-sales'
                            ? 'bg-white text-green-700 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Clock size={18} />
                        Flash Sales
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px]">
                {activeTab === 'coupons' && <CouponsTab />}
                {activeTab === 'flash-sales' && <FlashSalesTab />}
            </div>
        </div>
    );
};

// --- COUPONS TAB ---
const CouponsTab = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: '',
        startYear: new Date().getFullYear(),
        validFromDate: '',
        validToDate: '',
        maxUsesPerUser: '1',
        keywords: ''
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const res = await fetch('http://localhost:5003/api/marketing/coupons');
            const data = await res.json();
            setCoupons(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching coupons:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5003/api/marketing/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowForm(false);
                fetchCoupons();
                setFormData({
                    code: '',
                    discountType: 'PERCENTAGE',
                    discountValue: '',
                    startYear: new Date().getFullYear(),
                    validFromDate: '',
                    validToDate: '',
                    maxUsesPerUser: '1',
                    keywords: ''
                });
            } else {
                toast.error('Failed to create coupon');
            }
        } catch (error) {
            console.error('Error creating coupon:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await fetch(`http://localhost:5003/api/marketing/coupons/${id}`, { method: 'DELETE' });
            fetchCoupons();
            toast.success('Coupon deleted!');
        } catch (error) {
            console.error('Error deleting coupon:', error);
            toast.error('Failed to delete coupon');
        } finally {
            setConfirmDeleteId(null);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Active Coupons</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                    <Plus size={18} />
                    Create Coupon
                </button>
            </div>

            {showForm && (
                <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="text-md font-medium mb-4">New Coupon Details</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                            <input
                                type="text"
                                placeholder="e.g. SAVE10"
                                className="w-full p-2 border rounded-lg uppercase"
                                value={formData.code}
                                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                            <select
                                className="w-full p-2 border rounded-lg"
                                value={formData.discountType}
                                onChange={e => setFormData({ ...formData, discountType: e.target.value })}
                            >
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="FIXED">Fixed Amount (₹)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                            <input
                                type="number"
                                placeholder="e.g. 10 or 50"
                                className="w-full p-2 border rounded-lg"
                                value={formData.discountValue}
                                onChange={e => setFormData({ ...formData, discountValue: e.target.value })}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses Per User</label>
                            <input
                                type="number"
                                placeholder="Default: 1"
                                className="w-full p-2 border rounded-lg"
                                value={formData.maxUsesPerUser}
                                onChange={e => setFormData({ ...formData, maxUsesPerUser: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (Comma separated)</label>
                            <input
                                type="text"
                                placeholder="e.g. SUMMER, HOT, NEWYEAR"
                                className="w-full p-2 border rounded-lg"
                                value={formData.keywords}
                                onChange={e => setFormData({ ...formData, keywords: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 border p-3 rounded-lg bg-white">
                            <div className="md:col-span-3 text-sm font-semibold text-gray-700">Recurring Validity Period</div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Start Year (Active From)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.startYear}
                                    onChange={e => setFormData({ ...formData, startYear: e.target.value })}
                                    placeholder="e.g. 2025"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Valid From (MM-DD)</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.validFromDate}
                                    onChange={e => setFormData({ ...formData, validFromDate: e.target.value })}
                                    placeholder="e.g. 12-30"
                                    pattern="\d{2}-\d{2}"
                                    title="Format: MM-DD"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Valid To (MM-DD)</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.validToDate}
                                    onChange={e => setFormData({ ...formData, validToDate: e.target.value })}
                                    placeholder="e.g. 01-05"
                                    pattern="\d{2}-\d{2}"
                                    title="Format: MM-DD"
                                    required
                                />
                            </div>
                            <div className="md:col-span-3 text-xs text-blue-600">
                                * Coupon recurs every year between these dates, starting from the Start Year.
                            </div>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                            >
                                Create Coupon
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 font-medium text-gray-600">Code</th>
                            <th className="p-4 font-medium text-gray-600">Discount</th>
                            <th className="p-4 font-medium text-gray-600">Validity</th>
                            <th className="p-4 font-medium text-gray-600">Usage</th>
                            <th className="p-4 font-medium text-gray-600">Status</th>
                            <th className="p-4 font-medium text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {coupons.map(coupon => (
                            <tr key={coupon._id} className="hover:bg-gray-50">
                                <td className="p-4 font-semibold text-green-700">
                                    {coupon.code}
                                    {coupon.keywords && coupon.keywords.length > 0 && (
                                        <div className="flex gap-1 mt-1 flex-wrap">
                                            {coupon.keywords.map((k, i) => (
                                                <span key={i} className="text-[10px] bg-gray-200 text-gray-600 px-1 rounded">{k}</span>
                                            ))}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                                </td>
                                <td className="p-4 text-sm text-gray-500">
                                    <div className="font-medium text-gray-900">Every Year</div>
                                    <div>{coupon.validFromDate} to {coupon.validToDate}</div>
                                    <div className="text-xs text-gray-400">From {coupon.startYear}</div>
                                </td>
                                <td className="p-4 text-sm text-gray-500">
                                    <div className="text-xs">Used: {coupon.usedCount}</div>
                                    <div className="text-xs">Limit/User: {coupon.maxUsesPerUser}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {coupon.isActive ? 'Active' : 'Expired'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {confirmDeleteId === coupon._id ? (
                                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                                            <span className="text-xs text-red-700 font-medium whitespace-nowrap">Delete?</span>
                                            <button
                                                onClick={() => handleDelete(coupon._id)}
                                                className="text-xs bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600 font-semibold"
                                            >Yes</button>
                                            <button
                                                onClick={() => setConfirmDeleteId(null)}
                                                className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded hover:bg-gray-300"
                                            >No</button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmDeleteId(coupon._id)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {coupons.length === 0 && !loading && (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-500">
                                    No coupons created yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
// --- FLASH SALES TAB ---
const FlashSalesTab = () => {
    const [flashSales, setFlashSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        bannerImage: '',
        status: 'Draft',
        startTime: '',
        endTime: '',
        timezone: 'IST',
        autoActivate: true,
        autoExpire: true,
        salesTarget: '',
        saleTag: '',
        approvalRequired: false,
        editLock: false,
        auditLog: true
    });

    // Helper: compute effective status from times (client-side fallback)
    const getEffectiveStatus = (sale) => {
        const now = new Date();
        const start = new Date(sale.startTime);
        const end = new Date(sale.endTime);
        if (sale.status === 'Ended' || now >= end) return 'Ended';
        if ((sale.status === 'Active') || (sale.status === 'Draft' && now >= start && now < end)) return 'Active';
        return sale.status; // Draft or Paused
    };

    const getStatusBadge = (sale) => {
        const status = getEffectiveStatus(sale);
        if (status === 'Active') return { label: '🟢 Live', cls: 'bg-green-500 text-white' };
        if (status === 'Ended') return { label: '🔴 Ended', cls: 'bg-red-500 text-white' };
        if (status === 'Paused') return { label: '⏸ Paused', cls: 'bg-yellow-500 text-white' };
        return { label: '📝 Draft', cls: 'bg-gray-500 text-white' };
    };

    useEffect(() => {
        fetchFlashSales();
        fetchProducts();
        // Poll every 30 seconds to keep statuses fresh
        const interval = setInterval(fetchFlashSales, 30 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchFlashSales = async () => {
        try {
            const res = await fetch('http://localhost:5003/api/marketing/flash-sales');
            const data = await res.json();
            if (Array.isArray(data)) {
                setFlashSales(data);
            } else {
                console.error("API Error: Expected array but got", data);
                setFlashSales([]);
            }
        } catch (error) {
            console.error(error);
            setFlashSales([]);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch('http://localhost:5003/api/products');
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error(error);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5003/api/marketing/flash-sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowForm(false);
                fetchFlashSales();
                toast.success('Flash Sale created successfully!');
                setFormData({
                    title: '', description: '', bannerImage: '', status: 'Draft',
                    startTime: '', endTime: '', timezone: 'IST', autoActivate: true, autoExpire: true,
                    salesTarget: '', saleTag: '', approvalRequired: false, editLock: false, auditLog: true
                });
            } else {
                const errData = await res.json();
                if (res.status === 409) {
                    toast.error(`⚠️ Time Conflict: ${errData.message}`, { duration: 6000 });
                } else {
                    toast.error(errData.message || 'Failed to create flash sale');
                }
            }
        } catch (error) {
            console.error(error);
            toast.error('Network error. Please try again.');
        }
    };
    const handleDelete = async (id) => {
        try {
            await fetch(`http://localhost:5003/api/marketing/flash-sales/${id}`, { method: 'DELETE' });
            fetchFlashSales();
            toast.success('Flash sale deleted!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete flash sale');
        } finally {
            setConfirmDeleteId(null);
        }
    }
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Live Flash Sales</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} />
                    New Flash Sale
                </button>
            </div>
            {showForm && (
                <div className="mb-8 bg-blue-50 p-6 rounded-lg border border-blue-100">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Create New Flash Sale</h3>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* --- 1. Basic Details --- */}
                        <div className="bg-white p-4 rounded-lg border">
                            <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">1. Basic Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Flash Sale Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Midnight Veggie Rush"
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        rows="2"
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                className="w-full p-1 border rounded-lg text-sm bg-gray-50"
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;
                                                    const data = new FormData();
                                                    data.append("file", file);
                                                    try {
                                                        const res = await fetch("http://localhost:5003/api/marketing/upload", { method: "POST", body: data });
                                                        if (!res.ok) throw new Error("Upload Failed");
                                                        const json = await res.json();
                                                        setFormData({ ...formData, bannerImage: json.secure_url });
                                                    } catch (err) {
                                                        console.error(err);
                                                        toast.error('Image Upload Failed. Using manual URL fallback.');
                                                    }
                                                }}
                                            />
                                            {formData.bannerImage && <img src={formData.bannerImage} className="h-10 w-10 object-cover rounded border" />}
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Or enter Image URL manually..."
                                            className="w-full p-2 border rounded-lg text-sm"
                                            value={formData.bannerImage}
                                            onChange={e => setFormData({ ...formData, bannerImage: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="Draft">Draft</option>
                                        <option value="Active">Active</option>
                                        <option value="Paused">Paused</option>
                                        <option value="Ended">Ended</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        {/* --- 2. Timing --- */}
                        <div className="bg-white p-4 rounded-lg border">
                            <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">2. Timing & Schedule</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.startTime}
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.endTime}
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.timezone}
                                        onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                                    >
                                        <option value="IST">IST (Indian Standard Time)</option>
                                        <option value="UTC">UTC</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-6 mt-6">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.autoActivate}
                                            onChange={e => setFormData({ ...formData, autoActivate: e.target.checked })}
                                        />
                                        Auto Activate
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.autoExpire}
                                            onChange={e => setFormData({ ...formData, autoExpire: e.target.checked })}
                                        />
                                        Auto Expire
                                    </label>
                                </div>
                            </div>
                        </div>


                        {/* --- 5. Security & Analytics --- */}
                        <div className="bg-white p-4 rounded-lg border">
                            <h4 className="font-semibold text-gray-700 mb-3 border-b pb-2">3. Security & Analytics</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sale Tag (Analytics)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. SUMMER_BLAST"
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.saleTag}
                                        onChange={e => setFormData({ ...formData, saleTag: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2 flex gap-6 mt-2">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.approvalRequired}
                                            onChange={e => setFormData({ ...formData, approvalRequired: e.target.checked })}
                                        />
                                        Req. Super Admin Approval
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.editLock}
                                            onChange={e => setFormData({ ...formData, editLock: e.target.checked })}
                                        />
                                        Lock Edits After Start
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.auditLog}
                                            onChange={e => setFormData({ ...formData, auditLog: e.target.checked })}
                                        />
                                        Enable Audit Log
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Publish Flash Sale
                            </button>
                        </div>
                    </form>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {flashSales.map(sale => (
                    <div key={sale._id} className="border rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow group">
                        {/* Banner Image */}
                        <div className="relative h-36 w-full overflow-hidden">
                            {sale.bannerImage ? (
                                <img src={sale.bannerImage} alt={sale.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                                    <span className="text-white text-4xl opacity-20">⚡</span>
                                </div>
                            )}
                            {/* Status badge overlay */}
                            {(() => {
                                const { label, cls } = getStatusBadge(sale); return (
                                    <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full font-bold shadow ${cls}`}>
                                        {label}
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="p-4">
                            <h3 className="font-semibold line-clamp-1 mb-0.5">{sale.title}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-3">{sale.description}</p>

                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded space-y-1">
                                <div className="flex justify-between">
                                    <span>Starts: {new Date(sale.startTime).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Ends: {new Date(sale.endTime).toLocaleString()}</span>
                                </div>
                                <div className="pt-2 border-t flex justify-between items-center mt-2">
                                    <span className="text-xs bg-gray-200 px-1 rounded">{sale.saleTag || sale.saleType || ''}</span>
                                    {confirmDeleteId === sale._id ? (
                                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                                            <span className="text-xs text-red-700 font-medium">Delete?</span>
                                            <button onClick={() => handleDelete(sale._id)} className="text-xs bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600 font-semibold">Yes</button>
                                            <button onClick={() => setConfirmDeleteId(null)} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded hover:bg-gray-300">No</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setConfirmDeleteId(sale._id)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"><Trash2 size={14} /></button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {flashSales.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500">
                        No active flash sales.
                    </div>
                )}
            </div>
        </div>
    );
};
export default MarketingPromotions;
