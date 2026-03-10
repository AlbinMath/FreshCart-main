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

    // ... (Filter logic remains same, abstracted below for brevity or assume kept unless replaced) ...
    // Note: Since I am replacing the top part, I need to ensure lines approx 46-130 are safely kept or I should use multi-replace if I want to be surgical.
    // However, the tool prompt says "Replace imports and Navbar/Hero section". 
    // I will use replace_file_content for the top chunk.

    const filteredProducts = products
        .filter(product => {
            // Always hide out-of-stock products
            const stockValue = Number(product.stockQuantity ?? 0);
            if (stockValue <= 0) return false;

            const productCategory = String(product.category || 'other').toLowerCase();
            const matchesCategory = selectedCategory === 'all' || productCategory === selectedCategory;
            const name = String(product.productName || '').toLowerCase();
            const desc = String(product.description || '').toLowerCase();
            const term = searchTerm.toLowerCase();
            const matchesSearch = name.includes(term) || desc.includes(term);
            return matchesCategory && matchesSearch;
        });

    // All displayed products are in-stock; sort by stock quantity descending
    const sortedFilteredProducts = [...filteredProducts].sort((a, b) => {
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
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

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

                                                    <h3 className="font-semibold text-lg text-center text-gray-800 mb-2 line-clamp-2">
                                                        {product.productName}
                                                    </h3>

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
