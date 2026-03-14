import React, { useState, useEffect } from 'react';
import DeliveryEstimate from './DeliveryEstimate';
import ProductReviewsDialog from './ProductReviewsDialog';
import apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProductDetailsDialog({ product, onClose, activeFlashSalePrice }) {
    if (!product) return null;

    const [activeImage, setActiveImage] = useState(product.images?.[0] || null);
    const [showReviews, setShowReviews] = useState(false);
    const [userOrder, setUserOrder] = useState(null);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const checkUserOrder = async () => {
            if (currentUser && product._id) {
                try {
                    const res = await apiService.get(`/payment/user-orders/${currentUser.uid}`);
                    if (res.success) {
                        const purchasedOrder = res.orders.find(o => 
                            (o.status?.toLowerCase() === 'delivered' || o.status?.toLowerCase() === 'placed' || o.status?.toLowerCase() === 'shipped') && 
                            o.items.some(item => String(item.productId || item._id) === String(product._id))
                        );
                        setUserOrder(purchasedOrder);
                    }
                } catch (err) {
                    console.error("Error checking orders:", err);
                }
            }
        };
        checkUserOrder();
    }, [currentUser, product._id]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(price);
    };

    const handleNextImage = (e) => {
        e.stopPropagation();
        if (!product.images || product.images.length <= 1) return;
        const currentIndex = product.images.indexOf(activeImage);
        setActiveImage(product.images[(currentIndex + 1) % product.images.length]);
    };

    const handlePrevImage = (e) => {
        e.stopPropagation();
        if (!product.images || product.images.length <= 1) return;
        const currentIndex = product.images.indexOf(activeImage);
        setActiveImage(product.images[(currentIndex - 1 + product.images.length) % product.images.length]);
    };

    const prepMins = parseFloat(product.preparationTime) || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row relative animate-fade-in-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10 bg-white rounded-full p-1 shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Left: Images */}
                <div className="md:w-1/2 p-6 bg-gray-50 flex flex-col items-center justify-center">
                    <div className="w-full h-64 md:h-80 mb-4 bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden relative group">
                        {activeImage ? (
                            <img src={activeImage} alt={product.productName} className="w-full h-full object-contain" />
                        ) : (
                            <div className="text-gray-300 text-6xl">📦</div>
                        )}
                        {product.images && product.images.length > 1 && (
                            <>
                                <button onClick={handlePrevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button onClick={handleNextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>
                    {product.images && product.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto w-full p-2">
                            {product.images.map((img, idx) => (
                                <button key={idx} onClick={() => setActiveImage(img)}
                                    className={`w-16 h-16 flex-shrink-0 rounded-md border-2 overflow-hidden ${activeImage === img ? 'border-blue-500' : 'border-transparent'}`}>
                                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Details */}
                <div className="md:w-1/2 p-6 md:p-8 space-y-5 overflow-y-auto">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">{product.productName}</h2>
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{product.category}</span>
                            <div className="mt-2 space-y-1 text-xs text-gray-500">
                                <p>Product ID: <span className="font-mono bg-gray-100 px-1 rounded">{product.product_id || product._id}</span></p>
                                <p>Seller ID: <span className="font-mono bg-gray-100 px-1 rounded">{product.sellerUniqueId || 'Unknown'}</span></p>
                            </div>
                        </div>
                        <div className="text-right">
                            {/* Star Rating Display */}
                            <div className="flex flex-col items-end mb-2">
                                <div className="flex text-yellow-400">
                                    {[...Array(5)].map((_, i) => (
                                        <svg key={i} className={`h-4 w-4 ${i < Math.round(product.averageRating || 0) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium">({product.reviewCount || 0} reviews)</span>
                            </div>

                            {activeFlashSalePrice !== null && activeFlashSalePrice !== undefined ? (
                                <>
                                    <p className="text-3xl font-bold text-red-600">{formatPrice(activeFlashSalePrice)}</p>
                                    <p className="text-sm text-gray-400 line-through">{formatPrice(product.sellingPrice)}</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-3xl font-bold text-green-600">{formatPrice(product.sellingPrice)}</p>
                                    {product.originalPrice && product.originalPrice > product.sellingPrice && (
                                        <p className="text-sm text-gray-400 line-through">{formatPrice(product.originalPrice)}</p>
                                    )}
                                </>
                            )}
                            <p className="text-xs text-gray-500 mt-1">per {product.unit}</p>
                        </div>
                    </div>

                    {/* Review Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowReviews(true)}
                            className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            View Reviews & Analysis
                        </button>
                        {userOrder ? (
                            <button
                                onClick={() => navigate(`/rate-product/${userOrder._id}/${product._id}`)}
                                className="flex-1 py-2 px-4 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Add Review
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/orders')}
                                title="You can only rate products you have purchased"
                                className="flex-1 py-2 px-4 bg-gray-200 text-gray-400 cursor-not-allowed rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                                disabled
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Purchased to Rate
                            </button>
                        )}
                    </div>

                    {/* Description */}
                    <div className="prose prose-sm text-gray-600">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Description</h3>
                        <p>{product.description || 'No description available.'}</p>
                    </div>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <span className="block text-gray-400 text-xs uppercase">Stock Status</span>
                            <span className={`font-medium ${product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {product.stockQuantity > 0 ? `${product.stockQuantity} ${product.unit || ''}` : 'Out of Stock'}
                            </span>
                        </div>
                        {product.freshnessGuarantee && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <span className="block text-gray-400 text-xs uppercase">Freshness</span>
                                <span className="font-medium text-gray-700">{product.freshnessGuarantee}</span>
                            </div>
                        )}
                        {product.preparationTime && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <span className="block text-gray-400 text-xs uppercase">Prep Time</span>
                                <span className="font-medium text-gray-700">{product.preparationTime} mins</span>
                            </div>
                        )}
                        {product.shelfLife && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <span className="block text-gray-400 text-xs uppercase">Shelf Life</span>
                                <span className="font-medium text-gray-700">{product.shelfLife}</span>
                            </div>
                        )}
                    </div>

                    {/* ✅ Estimated Delivery Time (with explanation toggle) */}
                    <DeliveryEstimate
                        storeAddress={product.storeAddress}
                        prepMins={prepMins}
                    />

                    {/* Attributes */}
                    <div className="border-t pt-4 space-y-2">
                        {product.storageInstructions && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Storage:</span>
                                <span className="text-gray-800 font-medium">{product.storageInstructions}</span>
                            </div>
                        )}
                        {product.meatType && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Meat Type:</span>
                                <span className="text-gray-800 font-medium">{product.meatType}</span>
                            </div>
                        )}
                        {product.cutType && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Cut Type:</span>
                                <span className="text-gray-800 font-medium">{product.cutType}</span>
                            </div>
                        )}
                    </div>

                    {/* Seller */}
                    <div className="border-t pt-4 flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                            Sold by<br />
                            <span className="font-bold text-gray-700 text-sm">{product.storeName || product.sellerName}</span>
                        </div>
                        {product.storeAddress && (
                            <div className="text-xs text-gray-400 text-right">{product.storeAddress}</div>
                        )}
                    </div>
                </div>
            </div>

            {showReviews && (
                <ProductReviewsDialog
                    productId={product._id}
                    onClose={() => setShowReviews(false)}
                />
            )}
        </div>
    );
}
