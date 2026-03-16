import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import EmailVerification from '../components/EmailVerification';
import { cartService } from '../services/cartService';
import apiService from '../services/apiService';
import ProductDetailsDialog from '../components/ProductDetailsDialog';
import ProductCardImage from '../components/ProductCardImage';
import ChatBot from '../components/ChatBot';

function Home() {
    const { currentUser, getUserProfile } = useAuth();
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');

    const [searchTerm, setSearchTerm] = useState('');
    const [addingToCart, setAddingToCart] = useState(new Set());
    const [viewingProduct, setViewingProduct] = useState(null);
    const [flashSales, setFlashSales] = useState([]);
    const [recommendedProducts, setRecommendedProducts] = useState([]);
    const [fetchingRecommendations, setFetchingRecommendations] = useState(false);


    // Fetch products from the public API
    useEffect(() => {
        const fetchProducts = async (isBackground = false) => {
            try {
                if (!isBackground) setLoading(true);
                // Use the apiService for consistent API calls
                const response = await apiService.get('/public/products', {}, false);

                if (response.success) {
                    setProducts(response.products);
                } else {
                    // Fallback for demo if API returns nothing valid/server error
                    if (!isBackground) setProducts([]);
                    // setError('Failed to fetch products from server');
                }
            } catch (err) {
                console.error('Error fetching products:', err);
                if (!isBackground) setError('Failed to load products from server');
            } finally {
                if (!isBackground) setLoading(false);
            }
        };

        fetchProducts();

        const fetchFlashSales = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/marketing/flash-sales`);
                const data = await res.json();
                if (Array.isArray(data)) setFlashSales(data);
            } catch (err) {
                console.error('Error fetching flash sales:', err);
            }
        };
        fetchFlashSales();

        const intervalId = setInterval(() => {
            fetchProducts(true);
        }, 5000);

        return () => clearInterval(intervalId);
    }, []);

    // Fetch recommendations when user or products change
    useEffect(() => {
        let isSubscribed = true;

        const fetchRecommendations = async () => {
            if (!currentUser || products.length === 0 || fetchingRecommendations) return;

            try {
                setFetchingRecommendations(true);
                const pythonApiUrl = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:6003';

                const response = await fetch(`${pythonApiUrl}/recommend`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUser.uid, limit: 4 })
                });
                const data = await response.json();

                if (isSubscribed && data.success && data.recommendations) {
                    const recIds = data.recommendations.map(r => r.productId);
                    const matched = products.filter(p => recIds.includes(String(p._id)));
                    const sortedMatched = recIds.map(id => matched.find(p => String(p._id) === id)).filter(Boolean);
                    setRecommendedProducts(sortedMatched);
                }
            } catch (err) {
                // If it's a port error, don't spam console
                if (err.message.includes('fetch')) {
                    console.debug('Recommendation service not reachable');
                } else {
                    console.error('Error fetching recommendations:', err);
                }
            } finally {
                if (isSubscribed) setFetchingRecommendations(false);
            }
        };

        const timeoutId = setTimeout(fetchRecommendations, 1000); // Small debounce
        return () => {
            isSubscribed = false;
            clearTimeout(timeoutId);
        };
    }, [currentUser?.uid, products.length]); // Minimize dependency changes

    const filteredProducts = products
        .map(product => {
            // Calculate relevance score
            const term = searchTerm.trim().toLowerCase();
            const name = String(product.productName || '').toLowerCase();
            const desc = String(product.description || '').toLowerCase();
            const cat = String(product.category || 'other').toLowerCase();

            let score = 0;
            if (!term) {
                score = 1;
            } else {
                const keywords = term.split(/\s+/).filter(Boolean);
                keywords.forEach(word => {
                    if (name.includes(word)) score += 10;
                    if (name === word) score += 20; // Bonus for exact word match in title
                    if (cat.includes(word)) score += 5;
                    if (desc.includes(word)) score += 2;
                });
            }

            return { ...product, searchScore: score };
        })
        .filter(product => {
            // Always hide out-of-stock products
            const stockValue = Number(product.stockQuantity ?? 0);
            if (stockValue <= 0) return false;

            const productCategory = String(product.category || 'other').toLowerCase();
            const matchesCategory = selectedCategory === 'all' || productCategory === selectedCategory;
            const matchesSearch = product.searchScore > 0;
            return matchesCategory && matchesSearch;
        });

    // Sort: 1. By search relevance (if searching) 2. By stock quantity
    const sortedFilteredProducts = [...filteredProducts].sort((a, b) => {
        if (searchTerm.trim()) {
            return b.searchScore - a.searchScore || (Number(b.stockQuantity ?? 0) - Number(a.stockQuantity ?? 0));
        }
        return Number(b.stockQuantity ?? 0) - Number(a.stockQuantity ?? 0);
    });

    const groupedByCategory = sortedFilteredProducts.reduce((acc, p) => {
        const key = String(p.category || 'other').toLowerCase();
        if (!acc[key]) acc[key] = [];
        acc[key].push(p);
        return acc;
    }, {});

    const categories = ['all', ...new Set(products.map(product => String(product.category || 'other').toLowerCase()))];

    const categoriesForDisplay = selectedCategory === 'all'
        ? Array.from(new Set(sortedFilteredProducts.map(p => String(p.category || 'other').toLowerCase())))
        : [selectedCategory];

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(price);
    };

    const getActiveFlashSalePrice = (product) => {
        if (!product.activeFlashSale || !product.flashSalePrice) return null;

        // Find if this specific flash sale is loaded and currently active
        const sale = flashSales.find(s => s._id === product.activeFlashSale);
        if (!sale) return null;

        const now = new Date();
        const start = new Date(sale.startTime);
        const end = new Date(sale.endTime);

        if (now >= start && now <= end && sale.status === 'Active') {
            return product.flashSalePrice;
        }
        return null;
    };

    const { showToast } = useToast();

    const handleAddToCart = async (product) => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        const profile = getUserProfile();
        if (profile?.role !== 'customer') {
            showToast('Only customers can add items to cart', 'error');
            return;
        }

        setAddingToCart(prev => new Set(prev).add(product._id));

        try {
            const activePrice = getActiveFlashSalePrice(product);
            const finalPrice = activePrice !== null ? activePrice : product.sellingPrice;

            // Construct the item object matching the Cart model
            const cartItem = {
                productId: product._id,
                productName: product.productName,
                price: finalPrice,
                quantity: 1,
                image: product.images && product.images.length > 0 ? product.images[0] : null,
                stock: product.stockQuantity,
                unit: product.unit,
                sellerId: product.sellerId,
                storeAddress: product.storeAddress || '',
                preparationTime: product.preparationTime || ''
            };

            await cartService.addToCart(currentUser.uid, cartItem);

            showToast('Product added to cart successfully!', 'success');
        } catch (err) {
            console.error('Error adding to cart:', err);
            showToast(err.message || 'Failed to add product to cart', 'error');
        } finally {
            setAddingToCart(prev => {
                const newSet = new Set(prev);
                newSet.delete(product._id);
                return newSet;
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">


            <div className="container mx-auto px-4 py-8">
                {/* Email Verification Banner */}
                {currentUser && <EmailVerification />}

                {/* Hero Section */}
                <div className="text-center mb-12">


                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        FreshCart
                    </h1>
                    <p className="text-lg text-gray-500 mb-8">
                        Join the smart fresh product delivery system
                    </p>


                </div>




                {/* Flash Sales Banner Section */}
                {flashSales.length > 0 && (
                    <div className="mb-10 space-y-4">
                        {flashSales.map(sale => {
                            // Compute time remaining for mini-countdown
                            const endMs = new Date(sale.endTime) - Date.now();
                            const hours = Math.max(0, Math.floor(endMs / (1000 * 60 * 60)));
                            const minutes = Math.max(0, Math.floor((endMs % (1000 * 60 * 60)) / (1000 * 60)));
                            return (
                                <div
                                    key={sale._id}
                                    onClick={() => navigate(`/flash-sale/${sale._id}`)}
                                    className="relative rounded-2xl overflow-hidden shadow-xl cursor-pointer group"
                                    style={{ minHeight: '160px', background: 'linear-gradient(135deg, #c0392b 0%, #e67e22 60%, #f39c12 100%)' }}
                                >
                                    {/* Background banner image */}
                                    {sale.bannerImage && (
                                        <div
                                            className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity duration-300"
                                            style={{ backgroundImage: `url(${sale.bannerImage})` }}
                                        />
                                    )}
                                    {/* Decorative lightning */}
                                    <div className="absolute right-8 top-0 bottom-0 flex items-center opacity-10 text-white pointer-events-none select-none">
                                        <span style={{ fontSize: '120px', lineHeight: 1 }}>&#9889;</span>
                                    </div>
                                    {/* Content */}
                                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 px-8 py-7 text-white">
                                        <div className="flex-1">
                                            <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-3 backdrop-blur-sm animate-pulse">
                                                &#9679; LIVE FLASH SALE
                                            </div>
                                            <h2 className="text-3xl font-extrabold drop-shadow-md mb-1">{sale.title}</h2>
                                            {sale.description && (
                                                <p className="text-white/80 text-sm line-clamp-2 max-w-lg">{sale.description}</p>
                                            )}
                                        </div>
                                        {/* Countdown + CTA */}
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="bg-black/30 backdrop-blur-md rounded-xl px-5 py-3 text-center border border-white/20">
                                                <p className="text-white/60 text-[10px] uppercase tracking-widest mb-1">Ends in</p>
                                                <span className="text-2xl font-extrabold tabular-nums">
                                                    {String(hours).padStart(2, '0')}h {String(minutes).padStart(2, '0')}m
                                                </span>
                                            </div>
                                            <div className="bg-white text-orange-600 font-bold text-sm px-5 py-2 rounded-xl shadow-lg group-hover:bg-orange-50 transition">
                                                Shop Now &#8594;
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}



                {/* Product Browsing Section */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                        Browse Fresh Products
                    </h2>


                    {/* Search and Filter Controls */}
                    <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search Bar */}
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Search products by name, category or description..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                        {searchTerm && (
                            <div className="mt-3 flex items-center justify-between text-sm">
                                <span className="text-gray-500 italic">
                                    Found {sortedFilteredProducts.length} product{sortedFilteredProducts.length !== 1 ? 's' : ''} for "{searchTerm}"
                                </span>
                                <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">
                                    Sorted by Relevance
                                </span>
                            </div>
                        )}
                    </div>

                    {/* AI Recommendations Section - Moved below search bar */}
                    {currentUser && recommendedProducts.length > 0 && (
                        <div className="mb-10 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100/50">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                                    <span className="bg-blue-600 text-white p-1 rounded-lg text-sm shadow-lg shadow-blue-200">✨</span>
                                    Recommended

                                </h2>

                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {recommendedProducts.map((product) => (
                                    <div key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group flex flex-col h-full">
                                        <div
                                            className="h-32 bg-gray-50 flex items-center justify-center cursor-pointer overflow-hidden"
                                            onClick={() => setViewingProduct(product)}
                                        >
                                            <div className="transform group-hover:scale-110 transition-transform duration-500 w-full h-full">
                                                <ProductCardImage
                                                    images={product.images}
                                                    altText={product.productName}
                                                />
                                            </div>
                                        </div>
                                        <div className="p-3 flex-1 flex flex-col">
                                            <h3 className="font-bold text-gray-800 mb-1 truncate text-xs">
                                                {product.productName}
                                            </h3>
                                            <div className="flex items-center gap-1 mb-2">
                                                <span className="text-[#FBBF24] text-xs">★</span>
                                                <span className="text-[10px] text-gray-500 font-medium">
                                                    {product.averageRating?.toFixed(1) || '0.0'}
                                                </span>
                                            </div>
                                            <div className="mt-auto pt-2 flex items-center justify-between border-t border-gray-50">
                                                <span className="text-indigo-600 font-extrabold text-sm">
                                                    {formatPrice(product.sellingPrice)}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAddToCart(product);
                                                    }}
                                                    disabled={product.stockQuantity === 0 || addingToCart.has(product._id)}
                                                    className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:bg-gray-200"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Products Grid */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <p className="mt-4 text-gray-600">Loading products...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <div className="text-red-500 mb-4">⚠️</div>
                            <p className="text-red-600">{error}</p>
                        </div>
                    ) : sortedFilteredProducts.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 mb-4">📦</div>
                            <p className="text-gray-600">
                                {products.length === 0 ? 'No products available at the moment.' : 'No products match your search criteria.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {categoriesForDisplay.map((category) => (
                                <div key={category}>
                                    <h3 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
                                        {category.charAt(0).toUpperCase() + category.slice(1)}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {(groupedByCategory[category] || []).map((product) => (
                                            <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                                {/* Product Image */}
                                                <div className="h-48 bg-gray-200 flex items-center justify-center">
                                                    <ProductCardImage
                                                        images={product.images}
                                                        altText={product.productName}
                                                    />
                                                </div>

                                                {/* Product Info */}
                                                <div className="p-4 relative">
                                                    {/* Flash Sale Badge */}
                                                    {getActiveFlashSalePrice(product) !== null && (
                                                        <div className="absolute -top-12 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md shadow-red-500/30 flex items-center gap-1 z-10 animate-pulse">
                                                            <span>⚡</span>FLASH SALE
                                                        </div>
                                                    )}

                                                    <h3 className="font-semibold text-lg text-center text-gray-800 mb-1 line-clamp-2">
                                                        {product.productName}
                                                    </h3>

                                                    {/* Rating Display */}
                                                    <div className="flex items-center justify-center gap-1 mb-2">
                                                        <div className="flex text-yellow-400">
                                                            {[...Array(5)].map((_, i) => (
                                                                <svg key={i} className={`h-3 w-3 ${i < Math.round(product.averageRating || 0) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                </svg>
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] text-gray-500">
                                                            {product.reviewCount > 0 ? `(${product.reviewCount})` : '(No reviews)'}
                                                        </span>
                                                    </div>

                                                    {product.description && (
                                                        <p className="text-gray-600 text-sm mb-3 line-clamp-2 text-justify">
                                                            {product.description}
                                                        </p>
                                                    )}

                                                    {/* Category Badge */}
                                                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-3">
                                                        {product.category}
                                                    </span>

                                                    {/* Price */}
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div>
                                                            {getActiveFlashSalePrice(product) !== null ? (
                                                                <>
                                                                    <span className="text-xl font-bold text-red-600">
                                                                        {formatPrice(getActiveFlashSalePrice(product))}
                                                                    </span>
                                                                    <span className="text-sm text-gray-400 line-through ml-2">
                                                                        {formatPrice(product.sellingPrice)}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="text-xl font-bold text-green-600">
                                                                        {formatPrice(product.sellingPrice)}
                                                                    </span>
                                                                    {product.originalPrice && product.originalPrice > product.sellingPrice && (
                                                                        <span className="text-sm text-gray-500 line-through ml-2">
                                                                            {formatPrice(product.originalPrice)}
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Stock Status */}
                                                        <span className={`text-xs px-2 py-1 rounded-full ${product.stockQuantity > 0
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {product.stockQuantity > 0 ? `${product.stockQuantity} ${product.unit || ''} in stock` : 'Out of stock'}
                                                        </span>
                                                    </div>

                                                    {/* Seller Info */}
                                                    <div className="text-xs text-gray-500 mb-3">
                                                        Sold by: {product.storeName || product.sellerName || 'Unknown Seller'}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setViewingProduct(product)}
                                                            className="flex-1 py-2 px-3 rounded-lg font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition-colors"
                                                        >
                                                            Details
                                                        </button>
                                                        {currentUser && (
                                                            <button
                                                                onClick={() => handleAddToCart(product)}
                                                                disabled={product.stockQuantity === 0 || addingToCart.has(product._id)}
                                                                className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm ${product.stockQuantity > 0 && !addingToCart.has(product._id)
                                                                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                    }`}
                                                            >
                                                                {addingToCart.has(product._id) ? 'Adding...' : 'Add to Cart'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Features Section */}
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="text-3xl mb-4">🥬</div>
                        <h3 className="text-xl font-semibold mb-2">Fresh Products</h3>
                        <p className="text-gray-600">
                            Get the freshest vegetables, fruits, and groceries delivered to your door.
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="text-3xl mb-4">🚚</div>
                        <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
                        <p className="text-gray-600">
                            Quick and reliable delivery service to ensure freshness.
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="text-3xl mb-4">📱</div>
                        <h3 className="text-xl font-semibold mb-2">Smart System</h3>
                        <p className="text-gray-600">
                            Intelligent ordering system that learns your preferences.
                        </p>
                    </div>
                </div>

                {/* Call to Action */}
                {!currentUser && (
                    <div className="text-center bg-blue-50 p-8 rounded-lg">
                        <h2 className="text-2xl font-semibold mb-4">Ready to get started?</h2>
                        <p className="text-gray-600 mb-6">
                            Join thousands of customers who trust FreshCart for their fresh product needs.
                        </p>
                        <Link
                            to="/register"
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg"
                        >
                            Start Shopping Now
                        </Link>
                    </div>
                )}
            </div>


            <ProductDetailsDialog
                product={viewingProduct}
                onClose={() => setViewingProduct(null)}
                activeFlashSalePrice={viewingProduct ? getActiveFlashSalePrice(viewingProduct) : null}
            />

            {/* Chat Bot Interface */}
            <ChatBot />
        </div>
    );
}

export default Home;
