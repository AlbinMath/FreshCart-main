import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/ui/dialog";
import { Badge } from "@/ui/badge";
import { ScrollArea } from "@/ui/scroll-area";
import { Separator } from "@/ui/separator";
import { Package, Tag, Info, Layers, Scale, Clock, Thermometer, Box, Store, MapPin, BadgeCheck, Calendar, Hash, User } from 'lucide-react';
import ProductImageSlider from './ProductImageSlider';

const ProductDetailsDialog = ({ open, onOpenChange, product }) => {
    if (!product) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b bg-gray-50/50">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <DialogTitle className="text-2xl font-bold tracking-tight">
                                    {product.productName}
                                </DialogTitle>
                                {product.status === 'forced-inactive' ? (
                                    <Badge variant="destructive" className="bg-red-600 hover:bg-red-700">
                                        Forced Inactive
                                    </Badge>
                                ) : (
                                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}
                                        className={product.status === 'active' ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500'}>
                                        {product.status === 'active' ? 'Active' : 'Inactive'}
                                    </Badge>
                                )}
                            </div>
                            {product.status === 'forced-inactive' && (
                                <div className="p-2 mb-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                                    <strong>Admin Notice:</strong> This product has been forced inactive by the administrator and is currently not editable. Please contact support for more details.
                                </div>
                            )}
                            <DialogDescription className="text-base text-gray-500 line-clamp-2 max-w-2xl">
                                {product.description}
                            </DialogDescription>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-green-600">₹{product.sellingPrice}</div>
                            {product.originalPrice && (
                                <div className="text-sm text-gray-400 line-through">MRP: ₹{product.originalPrice}</div>
                            )}
                            {product.discount > 0 && (
                                <Badge variant="destructive" className="mt-1">{product.discount}% OFF</Badge>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                            {/* Left Column: Images (5 cols) */}
                            <div className="lg:col-span-5 space-y-4">
                                <div className="aspect-square rounded-xl border overflow-hidden bg-gray-50 shadow-sm">
                                    <img
                                        src={product.image || (product.images && product.images[0])}
                                        alt={product.productName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {product.images && product.images.length > 1 && (
                                    <div className="grid grid-cols-4 gap-2">
                                        {product.images.map((img, idx) => (
                                            <div key={idx} className="aspect-square rounded-lg border overflow-hidden bg-gray-50 cursor-pointer hover:border-green-500 transition-colors">
                                                <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Details (7 cols) */}
                            <div className="lg:col-span-7 space-y-8">

                                {/* Key Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Category</span>
                                        <p className="font-semibold text-gray-900 mt-1 truncate">{product.category || 'N/A'}</p>
                                    </div>
                                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                                        <span className="text-xs text-orange-600 font-semibold uppercase tracking-wider">Stock</span>
                                        <p className="font-semibold text-gray-900 mt-1">{product.stockQuantity || 0} units</p>
                                    </div>
                                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                                        <span className="text-xs text-purple-600 font-semibold uppercase tracking-wider">Min Order</span>
                                        <p className="font-semibold text-gray-900 mt-1">{product.minimumOrderQuantity || 1}</p>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                        <span className="text-xs text-green-600 font-semibold uppercase tracking-wider">Unit</span>
                                        <p className="font-semibold text-gray-900 mt-1">{product.quantity} {product.unit}</p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Specifications */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                                        <Layers className="h-4 w-4 text-green-600" /> Product Specifications
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Box className="h-4 w-4" /> Meat Type
                                            </div>
                                            <span className="font-medium text-sm">{product.meatType || '-'}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Scale className="h-4 w-4" /> Cut Type
                                            </div>
                                            <span className="font-medium text-sm">{product.cutType || '-'}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Clock className="h-4 w-4" /> Prep Time
                                            </div>
                                            <span className="font-medium text-sm">{product.preparationTime || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Features */}
                                {product.features && product.features.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
                                            <Tag className="h-4 w-4 text-green-600" /> Key Features
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {product.features.map((feature, idx) => (
                                                <Badge key={idx} variant="outline" className="text-sm py-1 px-3 bg-gray-50 border-gray-200">
                                                    <span className="text-gray-500 mr-1">{feature.key}:</span>
                                                    <span className="font-medium text-gray-900">{feature.value}</span>
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Storage Info */}
                                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                                    <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-3">
                                        <Thermometer className="h-4 w-4" /> Storage & Freshness
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-amber-800">
                                        <div>
                                            <span className="block text-xs uppercase tracking-wider opacity-70 mb-1">Freshness Guarantee</span>
                                            <p className="font-medium">{product.freshnessGuarantee || 'Standard Guarantee'}</p>
                                        </div>
                                        <div>
                                            <span className="block text-xs uppercase tracking-wider opacity-70 mb-1">Shelf Life</span>
                                            <p className="font-medium">{product.shelfLife || 'Check packaging'}</p>
                                        </div>
                                        <div className="sm:col-span-2 pt-2 border-t border-amber-200/50">
                                            <span className="block text-xs uppercase tracking-wider opacity-70 mb-1">Storage Instructions</span>
                                            <p>{product.storageInstructions || 'Keep refrigerated.'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Seller Info */}
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                                        <Store className="h-4 w-4 text-blue-600" /> Seller Information
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-white p-2 rounded-full border shadow-sm">
                                                <Store className="h-5 w-5 text-gray-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{product.storeName || 'Unknown Store'}</p>
                                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                                    <User className="h-3 w-3" /> {product.sellerName || 'Unknown Seller'}
                                                </div>
                                            </div>
                                        </div>

                                        <Separator className="bg-gray-200" />

                                        <div className="grid grid-cols-1 gap-2 text-sm">
                                            <div className="flex items-start gap-2 text-gray-600">
                                                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                                <span>{product.storeAddress || 'No Address Available'}</span>
                                            </div>
                                            {product.sellerUniqueId && (
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <BadgeCheck className="h-4 w-4 shrink-0 text-blue-500" />
                                                    <span>Seller ID: <span className="font-mono bg-gray-100 px-1 rounded">{product.sellerUniqueId}</span></span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Product Meta */}
                                <div className="pt-4 border-t flex flex-wrap gap-4 text-xs text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Hash className="h-3 w-3" /> ID: {product._id}
                                    </div>
                                    {product.createdAt && (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> Created: {new Date(product.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog >
    );
};

export default ProductDetailsDialog;
