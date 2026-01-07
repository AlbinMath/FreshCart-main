import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../navbar/Navbar';
import Footer from '../navbar/Footer';
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
    const [stock, setStock] = useState(false);
    const [addingToCart, setAddingToCart] = useState(new Set());
    const [viewingProduct, setViewingProduct] = useState(null);


    // Fetch products from the public API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                // Use the apiService for consistent API calls
                const response = await apiService.get('/public/products', {}, false);

                if (response.success) {
                    setProducts(response.products);
                } else {
                    // Fallback for demo if API returns nothing valid/server error
                    setProducts([]);
                    // setError('Failed to fetch products from server');
                }
            } catch (err) {
                console.error('Error fetching products:', err);
                // setError('Failed to load products from server');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // ... (Filter logic remains same, abstracted below for brevity or assume kept unless replaced) ...
    // Note: Since I am replacing the top part, I need to ensure lines approx 46-130 are safely kept or I should use multi-replace if I want to be surgical.
    // However, the tool prompt says "Replace imports and Navbar/Hero section". 
    // I will use replace_file_content for the top chunk.

    const filteredProducts = products
        .filter(product => {
            const productCategory = String(product.category || 'other').toLowerCase();
            const matchesCategory = selectedCategory === 'all' || productCategory === selectedCategory;
            const name = String(product.productName || '').toLowerCase();
            const desc = String(product.description || '').toLowerCase();
            const term = searchTerm.toLowerCase();
            const matchesSearch = name.includes(term) || desc.includes(term);
            const stockValue = Number(product.stockQuantity ?? 0);
            const matchesStock = !stock || stockValue > 0; // Fixed logic: if stock checked, must be > 0
            return matchesCategory && matchesSearch && matchesStock;
        });

    const sortedFilteredProducts = [...filteredProducts].sort((a, b) => {
        const aStock = Number(a.stockQuantity ?? 0);
        const bStock = Number(b.stockQuantity ?? 0);
        const aIn = aStock > 0;
        const bIn = bStock > 0;
        if (aIn && !bIn) return -1;
        if (!aIn && bIn) return 1;
        return bStock - aStock;
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

    const handleAddToCart = async (product) => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        const profile = getUserProfile();
        if (profile?.role !== 'customer') {
            alert('Only customers can add items to cart');
            return;
        }

        setAddingToCart(prev => new Set(prev).add(product._id));

        try {
            // Construct the item object matching the Cart model
            const cartItem = {
                productId: product._id,
                productName: product.productName,
                price: product.sellingPrice,
                quantity: 1,
                image: product.images && product.images.length > 0 ? product.images[0] : null,
                stock: product.stockQuantity,
                sellerId: product.sellerId
            };

            await cartService.addToCart(currentUser.uid, cartItem);

            alert('Product added to cart successfully!');
        } catch (err) {
            console.error('Error adding to cart:', err);
            alert(err.message || 'Failed to add product to cart');
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
            <Navbar />

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
                                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">
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
                                                <div className="p-4">
                                                    <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-2">
                                                        {product.productName}
                                                    </h3>

                                                    {product.description && (
                                                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
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
                                                            <span className="text-xl font-bold text-green-600">
                                                                {formatPrice(product.sellingPrice)}
                                                            </span>
                                                            {product.originalPrice && product.originalPrice > product.sellingPrice && (
                                                                <span className="text-sm text-gray-500 line-through ml-2">
                                                                    {formatPrice(product.originalPrice)}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Stock Status */}
                                                        <span className={`text-xs px-2 py-1 rounded-full ${product.stockQuantity > 0
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
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
            {/* Footer */}
            <Footer />

            {/* Product Details Modal */}
            <ProductDetailsDialog
                product={viewingProduct}
                onClose={() => setViewingProduct(null)}
            />

            {/* Chat Bot Interface */}
            <ChatBot />
        </div>
    );
}

export default Home;
