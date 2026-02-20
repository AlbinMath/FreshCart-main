import React, { useState } from 'react';

export default function ProductDetailsDialog({ product, onClose }) {
    if (!product) return null;

    const [activeImage, setActiveImage] = useState(product.images?.[0] || null);

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
        const nextIndex = (currentIndex + 1) % product.images.length;
        setActiveImage(product.images[nextIndex]);
    };

    const handlePrevImage = (e) => {
        e.stopPropagation();
        if (!product.images || product.images.length <= 1) return;
        const currentIndex = product.images.indexOf(activeImage);
        const prevIndex = (currentIndex - 1 + product.images.length) % product.images.length;
        setActiveImage(product.images[prevIndex]);
    };

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
                            <img
                                src={activeImage}
                                alt={product.productName}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="text-gray-300 text-6xl">📦</div>
                        )}

                        {/* Navigation Arrows */}
                        {product.images && product.images.length > 1 && (
                            <>
                                <button
                                    onClick={handlePrevImage}
                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleNextImage}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>
                    {/* Thumbnails */}
                    {product.images && product.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto w-full p-2">
                            {product.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveImage(img)}
                                    className={`w-16 h-16 flex-shrink-0 rounded-md border-2 overflow-hidden ${activeImage === img ? 'border-blue-500' : 'border-transparent'}`}
                                >
                                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Details */}
                <div className="md:w-1/2 p-6 md:p-8 space-y-6">
                    <div>
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-800 mb-2">{product.productName}</h2>
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                    {product.category}
                                </span>
                                <div className="mt-2 space-y-1 text-xs text-gray-500">
                                    <p>Product ID: <span className="font-mono bg-gray-100 px-1 rounded">{product.product_id || product._id}</span></p>
                                    <p>Seller ID: <span className="font-mono bg-gray-100 px-1 rounded">{product.sellerUniqueId || 'Unknown'}</span></p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold text-green-600">{formatPrice(product.sellingPrice)}</p>
                                {product.originalPrice && product.originalPrice > product.sellingPrice && (
                                    <p className="text-sm text-gray-400 line-through">{formatPrice(product.originalPrice)}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">per {product.unit}</p>
                            </div>
                        </div>
                    </div>

                    <div className="prose prose-sm text-gray-600">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Description</h3>
                        <p>{product.description || "No description available."}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <span className="block text-gray-400 text-xs uppercase">Stock Status</span>
                            <span className={`font-medium ${product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {product.stockQuantity > 0 ? `${product.stockQuantity} ${product.unit || ''} ` : 'Out of Stock'}
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

                    {/* Specific Attributes */}
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

                    {/* Seller Info */}
                    <div className="border-t pt-4 flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                            Sold by <br />
                            <span className="font-bold text-gray-700 text-sm">{product.storeName || product.sellerName}</span>
                        </div>
                        {product.storeAddress && (
                            <div className="text-xs text-gray-400 text-right">
                                {product.storeAddress}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
