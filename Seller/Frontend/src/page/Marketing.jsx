import React, { useState, useEffect } from 'react';
import { Tag, Clock, Plus, Trash2 } from 'lucide-react';

const getSellerId = () => {
    const info = localStorage.getItem('sellerInfo');
    if (info) {
        const parsed = JSON.parse(info);
        return parsed.user ? parsed.user._id : parsed._id;
    }
    return null;
};

const Marketing = () => {
    const [activeTab, setActiveTab] = useState('coupons');

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Marketing & Promotions</h1>
                    <p className="text-gray-500 mt-1">Manage store-specific coupons and flash sales</p>
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

const CouponsTab = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const sellerId = getSellerId();

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
        if (sellerId) fetchCoupons();
    }, [sellerId]);

    const fetchCoupons = async () => {
        try {
            const res = await fetch(`http://localhost:5002/api/marketing/coupons/${sellerId}`);
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
            const payload = { ...formData, sellerId };
            const res = await fetch('http://localhost:5002/api/marketing/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setShowForm(false);
                fetchCoupons();
                setFormData({
                    code: '', discountType: 'PERCENTAGE', discountValue: '',
                    startYear: new Date().getFullYear(), validFromDate: '', validToDate: '',
                    maxUsesPerUser: '1', keywords: ''
                });
            } else {
                alert('Failed to create coupon');
            }
        } catch (error) {
            console.error('Error creating coupon:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await fetch(`http://localhost:5002/api/marketing/coupons/${id}/${sellerId}`, { method: 'DELETE' });
            fetchCoupons();
        } catch (error) {
            console.error('Error deleting coupon:', error);
        } finally {
            setConfirmDeleteId(null);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Active Coupons</h2>
                <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    <Plus size={18} /> Create Coupon
                </button>
            </div>

            {showForm && (
                <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="text-md font-medium mb-4">New Coupon Details</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                            <input type="text" placeholder="e.g. SAVE10" className="w-full p-2 border rounded-lg uppercase" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                            <select className="w-full p-2 border rounded-lg" value={formData.discountType} onChange={e => setFormData({ ...formData, discountType: e.target.value })}>
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="FIXED">Fixed Amount (â‚¹)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
                            <input type="number" placeholder="e.g. 10 or 50" className="w-full p-2 border rounded-lg" value={formData.discountValue} onChange={e => setFormData({ ...formData, discountValue: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Uses Per User</label>
                            <input type="number" placeholder="Default: 1" className="w-full p-2 border rounded-lg" value={formData.maxUsesPerUser} onChange={e => setFormData({ ...formData, maxUsesPerUser: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (Comma separated)</label>
                            <input type="text" placeholder="e.g. SUMMER, HOT, NEWYEAR" className="w-full p-2 border rounded-lg" value={formData.keywords} onChange={e => setFormData({ ...formData, keywords: e.target.value })} />
                        </div>
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 border p-3 rounded-lg bg-white">
                            <div className="md:col-span-3 text-sm font-semibold text-gray-700">Recurring Validity Period</div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Start Year</label>
                                <input type="number" className="w-full p-2 border rounded-lg" value={formData.startYear} onChange={e => setFormData({ ...formData, startYear: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Valid From (MM-DD)</label>
                                <input type="text" className="w-full p-2 border rounded-lg" value={formData.validFromDate} onChange={e => setFormData({ ...formData, validFromDate: e.target.value })} pattern="\d{2}-\d{2}" placeholder="MM-DD" required />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Valid To (MM-DD)</label>
                                <input type="text" className="w-full p-2 border rounded-lg" value={formData.validToDate} onChange={e => setFormData({ ...formData, validToDate: e.target.value })} pattern="\d{2}-\d{2}" placeholder="MM-DD" required />
                            </div>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">Create Coupon</button>
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
                            <th className="p-4 font-medium text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {coupons.map(coupon => (
                            <tr key={coupon._id} className="hover:bg-gray-50">
                                <td className="p-4 font-semibold text-green-700">{coupon.code}</td>
                                <td className="p-4">{coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `â‚¹${coupon.discountValue} OFF`}</td>
                                <td className="p-4 text-sm text-gray-500">
                                    {coupon.validFromDate} to {coupon.validToDate} ({coupon.startYear})
                                </td>
                                <td className="p-4 text-sm text-gray-500">Used: {coupon.usedCount}</td>
                                <td className="p-4">
                                    <button onClick={() => handleDelete(coupon._id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const FlashSalesTab = () => {
    const [flashSales, setFlashSales] = useState([]);
    const [allFlashSales, setAllFlashSales] = useState([]); // includes ended ones for title lookup
    const [products, setProducts] = useState([]);
    const [selectedSaleId, setSelectedSaleId] = useState(null);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [editingPriceId, setEditingPriceId] = useState(null);
    const [editingPriceValue, setEditingPriceValue] = useState('');
    const [saving, setSaving] = useState(false);

    // Form state for enrollment
    const [selectedProductId, setSelectedProductId] = useState('');
    const [flashSalePrice, setFlashSalePrice] = useState('');

    // Parse seller info from localStorage - try multiple key paths
    const sellerInfo = JSON.parse(localStorage.getItem('sellerInfo') || '{}');
    const sellerId = sellerInfo?.user?._id || sellerInfo?._id || null;
    const sellerUniqueId = sellerInfo?.user?.sellerId || sellerInfo?.sellerId || sellerInfo?.user?.sellerUniqueId || sellerInfo?.sellerUniqueId || null;

    useEffect(() => {
        if (sellerId) {
            fetchAdminFlashSales();
            fetchSellerProducts();
        }
        // Poll every 30s to refresh live/ended statuses
        const interval = setInterval(() => {
            if (sellerId) { fetchAdminFlashSales(); fetchSellerProducts(); }
        }, 30 * 1000);
        return () => clearInterval(interval);
    }, [sellerId]);

    const fetchAdminFlashSales = async () => {
        try {
            // fetch ACTIVE ones for cards
            const res = await fetch(`http://localhost:5002/api/marketing/admin-flash-sales`);
            const data = await res.json();
            if (Array.isArray(data)) setFlashSales(data);

            // also fetch all (including ended) for title lookup in enrolled table
            const res2 = await fetch(`http://localhost:5002/api/marketing/all-admin-flash-sales`);
            const data2 = await res2.json();
            if (Array.isArray(data2)) setAllFlashSales(data2);
        } catch (error) { console.error('fetchAdminFlashSales error:', error); }
    };

    const fetchSellerProducts = async () => {
        try {
            if (!sellerUniqueId && !sellerId) return;
            let url = sellerUniqueId
                ? `http://localhost:5002/api/products/seller/${sellerUniqueId}`
                : `http://localhost:5002/api/products/by-seller-id/${sellerId}`;
            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) {
                setProducts(data);
            } else if (data.success && Array.isArray(data.products)) {
                setProducts(data.products);
            }
        } catch (error) { console.error('fetchSellerProducts error:', error); }
    };

    const handleEnroll = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5002/api/marketing/enroll-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sellerId,
                    productId: selectedProductId,
                    flashSaleId: selectedSaleId,
                    flashSalePrice: Number(flashSalePrice)
                })
            });
            if (res.ok) {
                setShowEnrollModal(false);
                setSelectedProductId('');
                setFlashSalePrice('');
                fetchSellerProducts();
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to enroll product');
            }
        } catch (error) { console.error(error); }
    };

    const handleUnenroll = async (productId) => {
        try {
            const res = await fetch('http://localhost:5002/api/marketing/unenroll-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sellerId, productId })
            });
            if (res.ok) fetchSellerProducts();
        } catch (error) { console.error(error); }
    };

    const handleUpdatePrice = async (productId) => {
        if (!editingPriceValue || isNaN(editingPriceValue)) return;
        setSaving(true);
        try {
            const res = await fetch('http://localhost:5002/api/marketing/update-flash-price', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sellerId, productId, flashSalePrice: Number(editingPriceValue) })
            });
            if (res.ok) {
                setEditingPriceId(null);
                setEditingPriceValue('');
                fetchSellerProducts();
            } else {
                alert('Failed to update price');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    // Get flash sale info including ended ones (for the enrolled table)
    const getFlashSaleInfo = (id) => {
        const sale = [...flashSales, ...allFlashSales].find(s => s._id === id || s._id?.toString() === id?.toString());
        return sale || null;
    };

    // Check if a flash sale is ended
    const isSaleEnded = (saleId) => {
        const sale = getFlashSaleInfo(saleId);
        if (!sale) return true; // no info = assume ended
        return new Date() >= new Date(sale.endTime) || sale.status === 'Ended';
    };

    const enrolledProducts = products.filter(p => p.activeFlashSale);
    const availableProducts = products.filter(p => !p.activeFlashSale && p.stockQuantity > 0 && p.status === 'active');

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-semibold">Active Flash Sales (Admin)</h2>
                    <p className="text-sm text-gray-500">Select an active platform flash sale to offer discounts on your products.</p>
                </div>
            </div>

            {/* Active Platform Flash Sales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {flashSales.length === 0 ? (
                    <div className="col-span-3 p-6 bg-gray-50 text-center text-gray-400 rounded-lg border border-dashed border-gray-200">
                        <Clock size={32} className="mx-auto mb-2 text-gray-300" />
                        No active flash sales available right now.
                    </div>
                ) : (
                    flashSales.map(sale => (
                        <div key={sale._id} className="border border-blue-200 rounded-xl overflow-hidden bg-white relative shadow-sm hover:shadow-md transition-shadow">
                            {/* Banner Image */}
                            <div className="relative h-32 w-full overflow-hidden">
                                {sale.bannerImage ? (
                                    <img src={sale.bannerImage} alt={sale.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                        <span className="text-white text-4xl font-bold opacity-20">&#9889;</span>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 text-white text-[10px] px-2 py-0.5 bg-green-500 rounded-full font-bold shadow-sm animate-pulse">&#9679; LIVE</div>
                            </div>

                            <div className="p-4">
                                <h3 className="font-bold text-base text-blue-900 mb-0.5 truncate">{sale.title}</h3>
                                <p className="text-xs text-blue-700 mb-3 line-clamp-2">{sale.description}</p>
                                <div className="text-xs text-gray-600 space-y-1 bg-blue-50 p-2 rounded-md border border-blue-100 mb-3">
                                    <div className="flex items-center gap-1.5"><Clock size={11} className="text-blue-500 flex-shrink-0" /> <strong>Starts:</strong>&nbsp;{new Date(sale.startTime).toLocaleString()}</div>
                                    <div className="flex items-center gap-1.5"><Clock size={11} className="text-red-400 flex-shrink-0" /> <strong>Ends:</strong>&nbsp;{new Date(sale.endTime).toLocaleString()}</div>
                                </div>
                                <button
                                    onClick={() => { setSelectedSaleId(sale._id); setShowEnrollModal(true); }}
                                    className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                                >
                                    + Enroll Products
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Enrolled Products Section */}
            <div className="mt-2 border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Your Enrolled Products</h2>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">{enrolledProducts.length} product{enrolledProducts.length !== 1 ? 's' : ''} enrolled</span>
                </div>
                <div className="overflow-x-auto border rounded-xl shadow-sm">
                    <table className="w-full text-left bg-white">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 font-medium text-gray-600">Product</th>
                                <th className="p-4 font-medium text-gray-600">Flash Sale</th>
                                <th className="p-4 font-medium text-gray-600">Original Price</th>
                                <th className="p-4 font-medium text-gray-600">Offer Price</th>
                                <th className="p-4 font-medium text-gray-600">Stock</th>
                                <th className="p-4 font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {enrolledProducts.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No products enrolled in any flash sales yet.</td></tr>
                            ) : (
                                enrolledProducts.map(product => {
                                    const saleInfo = getFlashSaleInfo(product.activeFlashSale);
                                    const ended = isSaleEnded(product.activeFlashSale);
                                    const outOfStock = product.stockQuantity <= 0;
                                    return (
                                        <tr key={product._id} className={`hover:bg-gray-50 ${ended ? 'opacity-75' : ''}`}>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {product.images?.[0] && <img src={product.images[0]} alt={product.productName} className="w-10 h-10 rounded-lg object-cover border flex-shrink-0" />}
                                                    <div>
                                                        <div className="font-medium text-sm">{product.productName}</div>
                                                        <div className="text-xs text-gray-400">{product.category}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm font-medium text-blue-700">{saleInfo?.title || 'Flash Sale'}</div>
                                                {ended ? (
                                                    <span className="inline-block mt-0.5 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">&#9679; Sale Ended</span>
                                                ) : (
                                                    <span className="inline-block mt-0.5 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">&#9679; Active</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-gray-400 line-through text-sm">Rs.{product.sellingPrice}</td>
                                            <td className="p-4">
                                                {editingPriceId === product._id ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            className="w-24 border rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                            value={editingPriceValue}
                                                            onChange={e => setEditingPriceValue(e.target.value)}
                                                            max={product.sellingPrice - 1}
                                                            min={1}
                                                            autoFocus
                                                        />
                                                        <button
                                                            onClick={() => handleUpdatePrice(product._id)}
                                                            disabled={saving}
                                                            className="text-xs bg-green-600 text-white px-2 py-1 rounded-md hover:bg-green-700 disabled:opacity-50"
                                                        >
                                                            {saving ? '...' : 'Save'}
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditingPriceId(null); setEditingPriceValue(''); }}
                                                            className="text-xs text-gray-500 hover:text-gray-700 px-1"
                                                        >X</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-green-600 font-bold">Rs.{product.flashSalePrice}</span>
                                                        {!ended && (
                                                            <button
                                                                onClick={() => { setEditingPriceId(product._id); setEditingPriceValue(product.flashSalePrice); }}
                                                                className="text-[10px] text-blue-500 hover:text-blue-700 underline"
                                                            >Edit</button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {outOfStock ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Out of Stock</span>
                                                ) : (
                                                    <span className="text-xs text-gray-600">{product.stockQuantity} left</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleUnenroll(product._id)}
                                                    className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md text-xs font-medium transition"
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Enroll Modal */}
            {showEnrollModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
                        <h2 className="text-xl font-bold mb-1">Offer Product to Sale</h2>
                        <p className="text-gray-500 text-sm mb-5">Select a product and set the discounted flash sale price.</p>

                        {availableProducts.length === 0 ? (
                            <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                                <p className="text-sm">No available products to enroll.</p>
                                <p className="text-xs text-gray-400 mt-1">Products must be active, in stock, and not already enrolled.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleEnroll} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Select Product</label>
                                    <select
                                        className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                                        value={selectedProductId}
                                        onChange={e => setSelectedProductId(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Choose a product --</option>
                                        {availableProducts.map(p => (
                                            <option key={p._id} value={p._id}>
                                                {p.productName} - Rs.{p.sellingPrice} ({p.stockQuantity} in stock)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedProductId && (() => {
                                    const selected = products.find(p => p._id === selectedProductId);
                                    return (
                                        <div>
                                            {selected && (
                                                <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 rounded-lg border">
                                                    {selected.images?.[0] && <img src={selected.images[0]} className="w-12 h-12 rounded object-cover border" alt={selected.productName} />}
                                                    <div>
                                                        <div className="font-semibold text-sm">{selected.productName}</div>
                                                        <div className="text-xs text-gray-500">Selling: Rs.{selected.sellingPrice} &middot; Stock: {selected.stockQuantity}</div>
                                                    </div>
                                                </div>
                                            )}
                                            <label className="block text-sm font-medium mb-1">Flash Sale Offer Price (Rs.)</label>
                                            <input
                                                type="number"
                                                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                                value={flashSalePrice}
                                                onChange={e => setFlashSalePrice(e.target.value)}
                                                placeholder="Enter discounted price"
                                                max={(selected?.sellingPrice || 999999) - 1}
                                                min={1}
                                                required
                                            />
                                            <p className="text-xs text-gray-400 mt-1">Must be lower than current selling price (Rs.{selected?.sellingPrice}).</p>
                                        </div>
                                    );
                                })()}

                                <div className="flex justify-end gap-3 mt-6">
                                    <button type="button" onClick={() => { setShowEnrollModal(false); setSelectedProductId(''); setFlashSalePrice(''); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
                                    <button type="submit" disabled={!selectedProductId || !flashSalePrice} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">Enroll Product</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default Marketing;
