import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { cartService } from '../services/cartService';
import ProductCardImage from '../components/ProductCardImage';
import ProductDetailsDialog from '../components/ProductDetailsDialog';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Countdown timer hook
function useCountdown(endTime) {
    const calcRemaining = () => {
        const diff = new Date(endTime) - Date.now();
        if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        return { hours, minutes, seconds, expired: false };
    };
    const [remaining, setRemaining] = useState(calcRemaining());
    useEffect(() => {
        const t = setInterval(() => setRemaining(calcRemaining()), 1000);
        return () => clearInterval(t);
    }, [endTime]);
    return remaining;
}

function Pad(n) { return String(n).padStart(2, '0'); }

function FlashSalePage() {
    const { saleId } = useParams();
    const navigate = useNavigate();
    const { currentUser, getUserProfile } = useAuth();
    const { showToast } = useToast();

    const [sale, setSale] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addingToCart, setAddingToCart] = useState(new Set());
    const [viewingProduct, setViewingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchSaleProducts = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/marketing/flash-sale-products/${saleId}`);
                if (!res.ok) {
                    const err = await res.json();
                    setError(err.message || 'Flash sale not available');
                    return;
                }
                const data = await res.json();
                setSale(data.sale);
                setProducts(data.products);
            } catch (err) {
                setError('Failed to load flash sale. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchSaleProducts();
        // Re-poll every 60s in case sale ends or stock changes
        const interval = setInterval(fetchSaleProducts, 60 * 1000);
        return () => clearInterval(interval);
    }, [saleId]);

    const countdown = useCountdown(sale?.endTime || Date.now());
    const formatPrice = (price) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price);

    const handleAddToCart = async (product) => {
        if (!currentUser) { navigate('/login'); return; }
        const profile = getUserProfile();
        if (profile?.role !== 'customer') {
            showToast('Only customers can add items to cart', 'error');
            return;
        }
        setAddingToCart(prev => new Set(prev).add(product._id));
        try {
            // Use flashSalePrice as the cart price
            const cartItem = {
                productId: product._id,
                productName: product.productName,
                price: product.flashSalePrice,        // <-- Flash sale offer price
                quantity: 1,
                image: product.images?.[0] || null,
                stock: product.stockQuantity,
                unit: product.unit,
                sellerId: product.sellerId,
                storeAddress: product.storeAddress || '',
                preparationTime: product.preparationTime || '',
                isFlashSale: true,
                flashSaleId: saleId
            };
            await cartService.addToCart(currentUser.uid, cartItem);
            showToast(`${product.productName} added to cart at flash sale price!`, 'success');
        } catch (err) {
            showToast(err.message || 'Failed to add to cart', 'error');
        } finally {
            setAddingToCart(prev => { const s = new Set(prev); s.delete(product._id); return s; });
        }
    };

    const filteredProducts = products.filter(p =>
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading flash sale...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-md max-w-md">
                    <div className="text-6xl mb-4">&#9203;</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Sale Ended</h2>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button onClick={() => navigate('/')} className="bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-orange-600 transition">
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Flash Sale Hero Banner */}
            <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #c0392b 0%, #e67e22 60%, #f39c12 100%)' }}>
                {/* Banner BG image overlay */}
                {sale?.bannerImage && (
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-25"
                        style={{ backgroundImage: `url(${sale.bannerImage})` }}
                    />
                )}
                <div className="relative z-10 container mx-auto px-4 py-12 text-white">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-white/80 hover:text-white text-sm mb-6 transition"
                    >
                        &#8592; Back to Home
                    </button>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1">
                            <div className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 backdrop-blur-sm">
                                &#9889; LIVE FLASH SALE
                            </div>
                            <h1 className="text-4xl md:text-5xl font-extrabold mb-3 drop-shadow-lg">{sale?.title}</h1>
                            {sale?.description && (
                                <p className="text-white/85 text-lg mb-4 max-w-xl">{sale.description}</p>
                            )}
                            <p className="text-white/70 text-sm">
                                {new Date(sale?.startTime).toLocaleString()} &mdash; {new Date(sale?.endTime).toLocaleString()}
                            </p>
                        </div>

                        {/* Countdown Timer */}
                        <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 min-w-[260px]">
                            <p className="text-white/70 text-xs uppercase tracking-widest mb-3 font-semibold">Sale Ends In</p>
                            {countdown.expired ? (
                                <p className="text-white text-2xl font-bold">Sale Ended</p>
                            ) : (
                                <div className="flex items-center justify-center gap-3">
                                    {[['HRS', countdown.hours], ['MIN', countdown.minutes], ['SEC', countdown.seconds]].map(([label, val]) => (
                                        <div key={label} className="text-center">
                                            <div className="bg-white/20 rounded-xl px-4 py-2 min-w-[60px]">
                                                <span className="text-3xl font-extrabold tabular-nums">{Pad(val)}</span>
                                            </div>
                                            <span className="text-[10px] text-white/60 font-semibold mt-1 block">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-white/60 text-xs mt-3">{products.length} product{products.length !== 1 ? 's' : ''} on sale</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Section */}
            <div className="container mx-auto px-4 py-10">
                {/* Search bar */}
                <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">Flash Sale Products</h2>
                    <input
                        type="text"
                        placeholder="Search sale products..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full md:w-72 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:outline-none text-sm"
                    />
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                        <div className="text-5xl mb-4">&#128230;</div>
                        <p className="text-gray-500 text-lg">No products found in this flash sale.</p>
                        <button onClick={() => navigate('/')} className="mt-4 text-orange-500 underline text-sm">Go to Home</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map(product => {
                            const discount = Math.round(((product.sellingPrice - product.flashSalePrice) / product.sellingPrice) * 100);
                            return (
                                <div key={product._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow border border-orange-100 relative group">
                                    {/* Discount badge */}
                                    <div className="absolute top-3 left-3 z-10 bg-red-600 text-white text-xs font-extrabold px-2 py-1 rounded-md shadow-lg">
                                        -{discount}% OFF
                                    </div>
                                    {/* Flash badge */}
                                    <div className="absolute top-3 right-3 z-10 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                        &#9889; FLASH
                                    </div>

                                    {/* Image */}
                                    <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                                        <ProductCardImage images={product.images} altText={product.productName} />
                                    </div>

                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-800 text-base mb-1 line-clamp-2 text-center">{product.productName}</h3>
                                        
                                        {/* Rating Display */}
                                        <div className="flex items-center justify-center gap-1 mb-2">
                                            <div className="flex text-yellow-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg key={i} className={`h-3 w-3 ${i < Math.round(product.averageRating || 0) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-gray-500 font-medium">({product.reviewCount || 0})</span>
                                        </div>
                                        {product.description && (
                                            <p className="text-gray-500 text-xs mb-2 line-clamp-2 text-center">{product.description}</p>
                                        )}
                                        <span className="inline-block bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full mb-3 font-medium">{product.category}</span>

                                        {/* Price - Flash Sale Price is primary */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <div className="text-xl font-extrabold text-red-600">
                                                    {formatPrice(product.flashSalePrice)}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-sm text-gray-400 line-through">{formatPrice(product.sellingPrice)}</span>
                                                    <span className="text-xs font-bold text-green-600">Save {formatPrice(product.sellingPrice - product.flashSalePrice)}</span>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${product.stockQuantity > 10 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {product.stockQuantity > 10 ? `${product.stockQuantity} left` : `Only ${product.stockQuantity} left!`}
                                            </span>
                                        </div>

                                        {/* Seller */}
                                        <p className="text-xs text-gray-400 mb-3">Sold by: {product.storeName || product.sellerName || 'Store'}</p>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setViewingProduct(product)}
                                                className="flex-1 py-2 px-3 rounded-lg font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition"
                                            >
                                                Details
                                            </button>
                                            {currentUser ? (
                                                <button
                                                    onClick={() => handleAddToCart(product)}
                                                    disabled={product.stockQuantity === 0 || addingToCart.has(product._id)}
                                                    className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition ${product.stockQuantity > 0 && !addingToCart.has(product._id)
                                                        ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200'
                                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                                >
                                                    {addingToCart.has(product._id) ? 'Adding...' : 'Add to Cart'}
                                                </button>
                                            ) : (
                                                <button onClick={() => navigate('/login')} className="flex-1 py-2 px-3 rounded-lg font-semibold text-sm bg-orange-500 hover:bg-orange-600 text-white transition">
                                                    Login to Buy
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Product Detail Dialog (reuses existing component) */}
            <ProductDetailsDialog
                product={viewingProduct}
                onClose={() => setViewingProduct(null)}
                activeFlashSalePrice={viewingProduct?.flashSalePrice || null}
            />
        </div>
    );
}

export default FlashSalePage;
