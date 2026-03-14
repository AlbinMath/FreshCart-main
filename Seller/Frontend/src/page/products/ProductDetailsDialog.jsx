import React, { useState } from 'react';
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
import { Package, Tag, Info, Layers, Scale, Clock, Thermometer, Box, Store, MapPin, BadgeCheck, Calendar, Hash, User, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import ProductImageSlider from './ProductImageSlider';
import { Button } from "@/ui/button";
import { toast } from "sonner";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/ui/accordion";

// Reusable Expandable Text Component
const ExpandableText = ({ text, limit = 150, className = "", clampLines = 2 }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!text) return null;

    const shouldShowToggle = text.length > limit;

    return (
        <div className="flex flex-col items-start gap-1">
            <p className={`${className} transition-all duration-200 ${!isExpanded ? `line-clamp-${clampLines}` : ''}`} style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: !isExpanded ? clampLines : 'unset', overflow: 'hidden' }}>
                {text}
            </p>
            {shouldShowToggle && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="text-xs font-medium text-green-600 hover:text-green-700 flex items-center gap-0.5 focus:outline-none mt-0.5"
                >
                    {isExpanded ? (
                        <>Show Less <ChevronUp className="h-3 w-3" /></>
                    ) : (
                        <>Read More <ChevronDown className="h-3 w-3" /></>
                    )}
                </button>
            )}
        </div>
    );
};

const ProductDetailsDialog = ({ open, onOpenChange, product, performanceData }) => {
    const [copiedId, setCopiedId] = useState(false);

    if (!product) return null;

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedId(true);
        toast.success("Product ID copied to clipboard");
        setTimeout(() => setCopiedId(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl w-[95vw] md:w-full h-[90vh] md:max-h-[95vh] flex flex-col p-0 overflow-hidden rounded-xl">
                <DialogHeader className="p-4 md:p-6 pb-4 border-b bg-gray-50/50 shrink-0">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-3 md:gap-4">
                        <div className="space-y-2 w-full">
                            <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                <DialogTitle className="text-xl md:text-2xl font-bold tracking-tight text-left">
                                    {product.productName}
                                </DialogTitle>
                                {product.status === 'forced-inactive' ? (
                                    <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 whitespace-nowrap">
                                        Forced Inactive
                                    </Badge>
                                ) : (
                                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}
                                        className={`whitespace-nowrap ${product.status === 'active' ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-500'}`}>
                                        {product.status === 'active' ? 'Active' : 'Inactive'}
                                    </Badge>
                                )}
                                {performanceData?.success && (
                                    <Badge variant="outline" className={`whitespace-nowrap flex items-center gap-1 border-none shadow-sm
                                        ${performanceData.tier === 'Excellent' ? 'bg-green-50 text-green-700' : 
                                          performanceData.tier === 'Good' ? 'bg-blue-50 text-blue-700' : 
                                          performanceData.tier === 'Average' ? 'bg-yellow-50 text-yellow-700' : 
                                          performanceData.tier === 'Poor' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}
                                    `}>
                                        <BadgeCheck className="h-3 w-3" />
                                        {performanceData.tier} Tier (AI Verified)
                                    </Badge>
                                )}
                            </div>
                            {product.status === 'forced-inactive' && (
                                <div className="p-2 mb-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                                    <strong>Admin Notice:</strong> This product has been forced inactive by the administrator.
                                </div>
                            )}
                            <div className="space-y-1">
                                <DialogDescription asChild>
                                    <div className="text-sm md:text-base text-gray-500 text-left">
                                        <ExpandableText
                                            text={product.description}
                                            className="text-gray-500"
                                            limit={150}
                                        />
                                    </div>
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto mt-2 md:mt-0 gap-2">
                            <div className="text-2xl md:text-3xl font-bold text-green-600">₹{product.sellingPrice}</div>
                            <div className="flex items-center gap-2">
                                {product.originalPrice && (
                                    <div className="text-xs md:text-sm text-gray-400 line-through">MRP: ₹{product.originalPrice}</div>
                                )}
                                {product.discount > 0 && (
                                    <Badge variant="destructive" className="text-xs">{product.discount}% OFF</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 w-full relative">
                    <div className="p-4 md:p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">

                            {/* Left Column: Images (4 cols - reduced from 5 to give details more room) */}
                            <div className="lg:col-span-4 space-y-4">
                                <div className="aspect-square w-full sm:w-2/3 lg:w-full mx-auto rounded-xl border overflow-hidden bg-gray-50 shadow-sm relative group">
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

                            {/* Right Column: Details (8 cols - increased from 7) */}
                            <div className="lg:col-span-8 space-y-6 md:space-y-8">

                                {/* Key Stats Grid - Conservative columns (2 cols) until 2xl screens, now optimized to 3/5 cols */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                                    <div className="p-2 md:p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <span className="text-[10px] md:text-xs text-blue-600 font-semibold uppercase tracking-wider">Category</span>
                                        <p className="font-semibold text-sm md:text-base text-gray-900 mt-1 truncate" title={product.category}>{product.category || 'N/A'}</p>
                                    </div>
                                    <div className="p-2 md:p-3 bg-orange-50 rounded-lg border border-orange-100">
                                        <span className="text-[10px] md:text-xs text-orange-600 font-semibold uppercase tracking-wider">Stock</span>
                                        <p className="font-semibold text-sm md:text-base text-gray-900 mt-1">{product.stockQuantity || 0} units</p>
                                    </div>
                                    <div className="p-2 md:p-3 bg-purple-50 rounded-lg border border-purple-100">
                                        <span className="text-[10px] md:text-xs text-purple-600 font-semibold uppercase tracking-wider">Min Order</span>
                                        <p className="font-semibold text-sm md:text-base text-gray-900 mt-1">{product.minimumOrderQuantity || 1}</p>
                                    </div>
                                    <div className="p-2 md:p-3 bg-green-50 rounded-lg border border-green-100">
                                        <span className="text-[10px] md:text-xs text-green-600 font-semibold uppercase tracking-wider">Unit / Qty</span>
                                        <p className="font-semibold text-sm md:text-base text-gray-900 mt-1">{product.quantity} {product.unit}</p>
                                    </div>
                                    <div className="p-2 md:p-3 bg-teal-50 rounded-lg border border-teal-100">
                                        <span className="text-[10px] md:text-xs text-teal-600 font-semibold uppercase tracking-wider">Prep Time</span>
                                        <p className="font-semibold text-sm md:text-base text-gray-900 mt-1">{product.preparationTime || 'N/A'}</p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Accordion for Details */}
                                <Accordion type="multiple" className="w-full" defaultValue={['specifications', 'storage']}>

                                    {/* Specifications */}
                                    <AccordionItem value="specifications">
                                        <AccordionTrigger className="text-sm font-bold text-gray-900 hover:no-underline hover:text-green-600">
                                            <div className="flex items-center gap-2">
                                                <Layers className="h-4 w-4 text-green-600" /> Product Specifications
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pt-1">
                                                {/* Meat Type & Cut Type - Only for relevant categories */}
                                                {(['Meat & Poultry', 'Seafood'].includes(product.category) || (product.meatType && product.meatType !== '-')) && (
                                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Box className="h-4 w-4" /> Meat Type
                                                        </div>
                                                        <span className="font-medium text-sm">{product.meatType || '-'}</span>
                                                    </div>
                                                )}
                                                {(['Meat & Poultry', 'Seafood'].includes(product.category) || (product.cutType && product.cutType !== '-')) && (
                                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Scale className="h-4 w-4" /> Cut Type
                                                        </div>
                                                        <span className="font-medium text-sm">{product.cutType || '-'}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Clock className="h-4 w-4" /> Prep Time
                                                    </div>
                                                    <span className="font-medium text-sm">{product.preparationTime || '-'}</span>
                                                </div>
                                            </div>

                                            {/* Features Display within Specifications */}
                                            {product.features && product.features.length > 0 && (
                                                <div className="mt-4">
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Key Features</h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {product.features.map((feature, idx) => (
                                                            <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100 text-sm">
                                                                <span className="text-gray-500">{feature.key}</span>
                                                                <span className="font-medium text-gray-900">{feature.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors mt-3">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Package className="h-4 w-4" /> Stock Quantity
                                                </div>
                                                <span className="font-medium text-sm">
                                                    {product.stockQuantity} {product.quantity === 1 ? product.unit : `units (${product.quantity} ${product.unit} each)`}
                                                </span>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* Features removed from separate accordion to include in Specifications above for better visibility */}

                                    {/* Storage Info */}
                                    <AccordionItem value="storage">
                                        <AccordionTrigger className="text-sm font-bold text-amber-900 hover:no-underline hover:text-amber-700">
                                            <div className="flex items-center gap-2">
                                                <Thermometer className="h-4 w-4" /> Storage & Freshness
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100 mt-1">
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
                                                        <ExpandableText text={product.storageInstructions || 'Keep refrigerated.'} limit={60} />
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>

                                    {/* AI Performance Analysis (SVM) */}
                                    {performanceData?.success && (
                                        <AccordionItem value="performance" className="border-green-100">
                                            <AccordionTrigger className="text-sm font-bold text-green-700 hover:no-underline hover:text-green-600">
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="h-4 w-4 text-green-600" /> AI Performance Analysis
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <div className="bg-green-50/30 rounded-lg p-4 border border-green-100 mt-1">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Performance Tier</span>
                                                            <span className="text-lg font-bold text-gray-900">{performanceData.tier}</span>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Confidence</span>
                                                            <span className="text-lg font-bold text-green-600">{(performanceData.confidence * 100).toFixed(0)}%</span>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-gray-600">Overall Satisfaction</span>
                                                                <span className="font-bold text-gray-900">{performanceData.metrics?.overall.toFixed(1)}/5.0</span>
                                                            </div>
                                                            <Progress value={(performanceData.metrics?.overall / 5) * 100} className="h-1.5 bg-gray-100 [&>div]:bg-green-500" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-gray-600">Product Quality</span>
                                                                <span className="font-bold text-gray-900">{performanceData.metrics?.quality.toFixed(1)}/5.0</span>
                                                            </div>
                                                            <Progress value={(performanceData.metrics?.quality / 5) * 100} className="h-1.5 bg-gray-100 [&>div]:bg-blue-500" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-xs">
                                                                <span className="text-gray-600">Delivery Reliability</span>
                                                                <span className="font-bold text-gray-900">{performanceData.metrics?.delivery.toFixed(1)}/5.0</span>
                                                            </div>
                                                            <Progress value={(performanceData.metrics?.delivery / 5) * 100} className="h-1.5 bg-gray-100 [&>div]:bg-orange-500" />
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 pt-3 border-t border-green-100/50 flex items-center justify-between">
                                                        <span className="text-[10px] text-gray-400 italic">Based on {performanceData.metrics?.review_count} verified reviews</span>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-7 text-green-700 hover:text-green-800 hover:bg-green-100 p-0 px-2 text-[10px] font-bold"
                                                            onClick={() => window.location.href = '/svm-analysis'}
                                                        >
                                                            VIEW FULL REPORT
                                                        </Button>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    )}
                                </Accordion>

                                {/* Product Meta */}
                                <div className="pt-4 border-t flex flex-wrap gap-4 text-xs text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Hash className="h-3 w-3" />
                                        <span>ID: <span className="font-mono text-gray-600">{product.product_id || product._id}</span></span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 ml-1"
                                            onClick={() => copyToClipboard(product.product_id || product._id)}
                                            title="Copy Product ID"
                                        >
                                            {copiedId ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-gray-400" />}
                                        </Button>
                                    </div>
                                    {product.createdAt && (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" /> Created: {new Date(product.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </div>
                                    )}
                                </div>

                                {/* Padding for scroll comfort */}
                                <div className="h-4"></div>

                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog >
    );
};

export default ProductDetailsDialog;
