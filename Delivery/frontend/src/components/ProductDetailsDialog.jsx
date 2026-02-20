import React, { useState } from 'react';
import { X, Package, MapPin, Tag, Box, Info } from 'lucide-react';

const ProductDetailsDialog = ({ isOpen, onClose, product }) => {
    const [activeImage, setActiveImage] = useState(0);

    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Package className="text-blue-600" size={24} />
                        Product Details
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Images */}
                    {product.images && product.images.length > 0 && (
                        <div className="space-y-4">
                            <div className="aspect-video w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                                <img
                                    src={product.images[activeImage]}
                                    alt={product.productName}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            {product.images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {product.images.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveImage(idx)}
                                            className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-blue-600 ring-2 ring-blue-100' : 'border-transparent opacity-70 hover:opacity-100'
                                                }`}
                                        >
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Main Info */}
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h1 className="text-2xl font-bold text-gray-900">{product.productName}</h1>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${product.stockQuantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                        </div>
                        <div className="flex items-baseline gap-3 mb-4">
                            <span className="text-2xl font-bold text-blue-600">₹{product.sellingPrice}</span>
                            {product.originalPrice > product.sellingPrice && (
                                <>
                                    <span className="text-gray-400 line-through">₹{product.originalPrice}</span>
                                    <span className="text-green-600 text-sm font-medium">-{product.discount}% OFF</span>
                                </>
                            )}
                        </div>
                        <p className="text-gray-600 leading-relaxed">{product.description}</p>
                    </div>

                    {/* Features / Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {product.category && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="text-xs text-gray-500 block mb-1">Category</span>
                                <span className="font-medium text-gray-800 flex items-center gap-1">
                                    <Tag size={14} /> {product.category}
                                </span>
                            </div>
                        )}
                        {product.quantity && product.unit && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="text-xs text-gray-500 block mb-1">Unit Size</span>
                                <span className="font-medium text-gray-800 flex items-center gap-1">
                                    <Box size={14} /> {product.quantity} {product.unit}
                                </span>
                            </div>
                        )}
                        {product.meatType && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="text-xs text-gray-500 block mb-1">Type</span>
                                <span className="font-medium text-gray-800">{product.meatType}</span>
                            </div>
                        )}
                        {product.cutType && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="text-xs text-gray-500 block mb-1">Cut</span>
                                <span className="font-medium text-gray-800">{product.cutType}</span>
                            </div>
                        )}
                    </div>

                    {/* Key Features List */}
                    {product.features && product.features.length > 0 && (
                        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <Info size={18} className="text-blue-500" /> Key Features
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {product.features.map((feature, idx) => (
                                    <div key={idx} className="flex justify-between text-sm p-2 bg-white rounded border border-blue-50">
                                        <span className="text-gray-500">{feature.key}</span>
                                        <span className="font-medium text-gray-800">{feature.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Seller Info */}
                    {product.storeName && (
                        <div className="border-t border-gray-100 pt-4 mt-4">
                            <h3 className="text-sm font-semibold text-gray-500 mb-2">Sold By</h3>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{product.storeName}</p>
                                    <p className="text-sm text-gray-500">{product.storeAddress}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetailsDialog;
