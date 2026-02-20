import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { Check, X, Eye, Store, Package, Clock, ShieldCheck, Thermometer, Tag, XCircle, Filter, RefreshCcw, ChevronLeft, ChevronRight, Copy, Calendar, Scale } from 'lucide-react';
import { ScrollArea } from "../ui/scroll-area";

const ProductApproval = () => {
    // Mock Data based on user request
    const initialProducts = [
        {
            _id: "694133e84702280eeb0ea815",
            productName: "Fresh Curry Cut Chicken",
            description: "Farm-fresh chicken cleaned and cut into medium curry pieces. Hygienically processed and packed on the same day. Ideal for curries and traditional dishes",
            category: "Meat",
            originalPrice: 320,
            sellingPrice: 280,
            discount: 12,
            quantity: 1,
            unit: "kg",
            stockQuantity: 50,
            sellerName: "Akhil's",
            storeName: "Akhil's Store",
            storeAddress: "GRFH+Q59, Koovappally, Kerala 686518",
            sellerUniqueId: "FC-SEL-RXPFT5",
            meatType: "Chicken",
            cutType: "Curry Cut",
            preparationTime: "30 mins",
            freshnessGuarantee: "1 Day",
            storageInstructions: "Keep Refrigerated (0–4°C)",
            images: [
                "https://res.cloudinary.com/dune3hshk/image/upload/v1765880804/products/jjdrqvxc6ctzepfrbvdw.jpg",
                "https://res.cloudinary.com/dune3hshk/image/upload/v1765880805/products/yow9awpzqb1d8qynunql.jpg",
                "https://res.cloudinary.com/dune3hshk/image/upload/v1765880806/products/z9tebxu4eujxkp38dxa8.jpg"
            ],
            status: "active",
            approvalStatus: "Pending",
            features: [],
            createdAt: "2025-12-16T10:26:48.397+00:00",
            updatedAt: "2025-12-17T09:38:38.968+00:00"
        }
    ];

    const [products, setProducts] = useState([]); // Initial empty state, will fetch
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [confirmAction, setConfirmAction] = useState(null); // { id, type: 'force' | 'restore' }

    // Fetch Products
    const fetchProducts = async () => {
        try {
            console.log('Fetching products...');
            const response = await fetch('/api/products');
            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Fetched data:', data);
            setProducts(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching products:", error);
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchProducts();
    }, []);

    const updateProductStatus = async (id, status, approvalStatus) => {
        try {
            const res = await fetch(`/api/products/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, approvalStatus })
            });
            if (res.ok) {
                // Refresh local state to reflect changes
                fetchProducts();
                setOpen(false);
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleApprove = (id) => updateProductStatus(id, 'active', 'Approved');
    const handleReject = (id) => updateProductStatus(id, 'inactive', 'Rejected');

    // Force Inactive -> Sets status to 'forced-inactive'
    const handleForceInactive = (id) => updateProductStatus(id, 'forced-inactive', undefined);

    // Remove Force Inactive -> Sets status back to 'inactive'
    const handleRemoveForceInactive = (id) => updateProductStatus(id, 'inactive', undefined);

    const openDetails = (product) => {
        setSelectedProduct(product);
        setActiveImageIndex(0);
        setOpen(true);
    };

    const nextImage = (e) => {
        e.stopPropagation();
        if (selectedProduct && selectedProduct.images) {
            setActiveImageIndex((prev) => (prev + 1) % selectedProduct.images.length);
        }
    };

    const prevImage = (e) => {
        e.stopPropagation();
        if (selectedProduct && selectedProduct.images) {
            setActiveImageIndex((prev) => (prev - 1 + selectedProduct.images.length) % selectedProduct.images.length);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Product Approval</h1>
                    <p className="text-sm text-gray-500">Review and approve vendor product submissions</p>
                </div>
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm self-start md:self-auto">
                    <div className="px-3 flex items-center gap-2 text-gray-500">
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-medium">Filter:</span>
                    </div>
                    <select
                        className="bg-transparent border-none text-sm text-gray-700 focus:ring-0 cursor-pointer font-medium py-1.5"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Products</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="forced-inactive">Forced Inactive</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="w-[80px] font-bold text-gray-600">Image</TableHead>
                            <TableHead className="font-bold text-gray-600">Product Name</TableHead>
                            <TableHead className="font-bold text-gray-600">Category</TableHead>
                            <TableHead className="font-bold text-gray-600">Price</TableHead>
                            <TableHead className="font-bold text-gray-600">Seller</TableHead>
                            <TableHead className="font-bold text-gray-600">Stock</TableHead>
                            <TableHead className="font-bold text-gray-600">Status</TableHead>
                            <TableHead className="text-right font-bold text-gray-600">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products
                            .filter(product => filterStatus === 'all' || product.status === filterStatus)
                            .map((product) => (
                                <TableRow key={product._id} className="hover:bg-gray-50 transition-colors duration-150">
                                    <TableCell>
                                        <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 border">
                                            <img
                                                src={product.images[0]}
                                                alt={product.productName}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {product.productName}
                                        <div className="text-xs text-gray-400 truncate w-40">{product.description}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            {product.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-900">₹{product.sellingPrice}</span>
                                            {product.originalPrice > product.sellingPrice && (
                                                <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-700">{product.storeName}</span>
                                            <span className="text-xs text-gray-500">{product.sellerName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-600 font-medium">{product.stockQuantity} {product.unit}</TableCell>
                                    <TableCell>
                                        <Badge className={`ml-2 ${product.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                            product.status === 'forced-inactive' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                                                'bg-gray-100 text-gray-700 hover:bg-gray-100'
                                            }`}>
                                            {product.status === 'forced-inactive' ? 'Forced Inactive' :
                                                product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => openDetails(product)}
                                                title="View Details"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>

                                            {(product.status === 'active' || product.status === 'inactive') && (
                                                confirmAction?.id === product._id && confirmAction?.type === 'force' ? (
                                                    <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                                                        <span className="text-xs text-red-700 font-medium whitespace-nowrap">Force inactive?</span>
                                                        <button onClick={() => { handleForceInactive(product._id); setConfirmAction(null); }} className="text-xs bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600 font-semibold">Yes</button>
                                                        <button onClick={() => setConfirmAction(null)} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded hover:bg-gray-300">No</button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: product._id, type: 'force' }); }}
                                                        title="Force Inactive"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                )
                                            )}

                                            {product.status === 'forced-inactive' && (
                                                confirmAction?.id === product._id && confirmAction?.type === 'restore' ? (
                                                    <div className="flex items-center gap-1 bg-green-50 border border-green-200 rounded-lg px-2 py-1">
                                                        <span className="text-xs text-green-700 font-medium whitespace-nowrap">Restore?</span>
                                                        <button onClick={() => { handleRemoveForceInactive(product._id); setConfirmAction(null); }} className="text-xs bg-green-500 text-white px-2 py-0.5 rounded hover:bg-green-600 font-semibold">Yes</button>
                                                        <button onClick={() => setConfirmAction(null)} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded hover:bg-gray-300">No</button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: product._id, type: 'restore' }); }}
                                                        title="Remove Force Inactive"
                                                    >
                                                        <RefreshCcw className="h-4 w-4" />
                                                    </Button>
                                                )
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="w-[95vw] max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white sm:rounded-xl">
                    {selectedProduct && (
                        <>
                            {/* Header Section */}
                            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start gap-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                                <div className="space-y-2 max-w-lg">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <DialogTitle className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                                            {selectedProduct.productName}
                                        </DialogTitle>
                                        <Badge className={`${selectedProduct.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                            selectedProduct.status === 'forced-inactive' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                                                'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            } border-0 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide`}>
                                            {selectedProduct.status === 'forced-inactive' ? 'Forced Inactive' : selectedProduct.status}
                                        </Badge>
                                    </div>
                                    <DialogDescription className="text-sm text-gray-500 leading-relaxed line-clamp-2 md:line-clamp-none">
                                        {selectedProduct.description}
                                    </DialogDescription>
                                </div>

                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-green-600 tracking-tight">
                                            ₹{selectedProduct.sellingPrice}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-gray-400 font-medium">MRP: <span className="line-through">₹{selectedProduct.originalPrice}</span></span>
                                        {selectedProduct.discount > 0 && (
                                            <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 border-0 text-[10px] px-1.5 py-0 h-5">
                                                {selectedProduct.discount}% OFF
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <ScrollArea className="flex-1 bg-gray-50/50">
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left Column: Images */}
                                    <div className="space-y-4">
                                        <div className="aspect-square w-full bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm relative group">
                                            <img
                                                src={selectedProduct.images[activeImageIndex]}
                                                alt={selectedProduct.productName}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                            {selectedProduct.images.length > 1 && (
                                                <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="secondary" size="icon" onClick={prevImage} className="rounded-full shadow-lg bg-white/90 hover:bg-white h-8 w-8">
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="secondary" size="icon" onClick={nextImage} className="rounded-full shadow-lg bg-white/90 hover:bg-white h-8 w-8">
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                            {selectedProduct.images.map((img, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setActiveImageIndex(i)}
                                                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${activeImageIndex === i ? 'border-green-500 ring-2 ring-green-100' : 'border-transparent hover:border-gray-200'
                                                        }`}
                                                >
                                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right Column: Stats & Details */}
                                    <div className="space-y-6">
                                        {/* Quick Stats Grid */}
                                        <div className="grid grid-cols-4 gap-3">
                                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1 group hover:bg-blue-50 transition-colors">
                                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Category</span>
                                                <span className="font-semibold text-blue-700 text-sm truncate w-full" title={selectedProduct.category}>{selectedProduct.category}</span>
                                            </div>
                                            <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1 group hover:bg-orange-50 transition-colors">
                                                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Stock</span>
                                                <span className="font-semibold text-orange-700 text-sm">{selectedProduct.stockQuantity}<span className="text-[10px] ml-0.5 font-normal opacity-80">pcs</span></span>
                                            </div>
                                            <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1 group hover:bg-purple-50 transition-colors">
                                                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Min Order</span>
                                                <span className="font-semibold text-purple-700 text-sm">{selectedProduct.minimumOrderQuantity || 1}</span>
                                            </div>
                                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex flex-col items-center justify-center text-center gap-1 group hover:bg-emerald-50 transition-colors">
                                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Unit</span>
                                                <span className="font-semibold text-emerald-700 text-sm">{selectedProduct.unit}</span>
                                            </div>
                                        </div>

                                        {/* Accordions */}
                                        <div className="space-y-4">
                                            {/* Product Specifications */}
                                            <details className="group bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden" open>
                                                <summary className="px-4 py-3 bg-white border-b border-gray-50 flex items-center justify-between cursor-pointer list-none select-none hover:bg-gray-50/50 transition-colors">
                                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                                                        <Package className="h-4 w-4 text-green-600" />
                                                        Product Specifications
                                                    </h3>
                                                    <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-90" />
                                                </summary>
                                                <div className="p-4 grid grid-cols-2 gap-4 bg-gray-50/30">
                                                    {(selectedProduct.quantity || selectedProduct.unit) && (
                                                        <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                                                            <div className="flex items-center gap-2 text-gray-500 mb-1 text-xs font-medium uppercase tracking-wide">
                                                                <Scale className="h-3 w-3" /> Net Quantity
                                                            </div>
                                                            <div className="font-semibold text-gray-900">{selectedProduct.quantity} {selectedProduct.unit}</div>
                                                        </div>
                                                    )}
                                                    {selectedProduct.meatType && (
                                                        <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                                                            <div className="flex items-center gap-2 text-gray-500 mb-1 text-xs font-medium uppercase tracking-wide">
                                                                <Tag className="h-3 w-3" /> Meat Type
                                                            </div>
                                                            <div className="font-semibold text-gray-900">{selectedProduct.meatType}</div>
                                                        </div>
                                                    )}
                                                    {selectedProduct.cutType && (
                                                        <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
                                                            <div className="flex items-center gap-2 text-gray-500 mb-1 text-xs font-medium uppercase tracking-wide">
                                                                <Tag className="h-3 w-3" /> Cut Type
                                                            </div>
                                                            <div className="font-semibold text-gray-900">{selectedProduct.cutType}</div>
                                                        </div>
                                                    )}
                                                    {selectedProduct.preparationTime && (
                                                        <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm col-span-2 sm:col-span-1">
                                                            <div className="flex items-center gap-2 text-gray-500 mb-1 text-xs font-medium uppercase tracking-wide">
                                                                <Clock className="h-3 w-3" /> Prep Time
                                                            </div>
                                                            <div className="font-semibold text-gray-900">{selectedProduct.preparationTime}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </details>

                                            <details className="group bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                                <summary className="px-4 py-3 bg-white border-b border-gray-50 flex items-center justify-between cursor-pointer list-none select-none hover:bg-gray-50/50 transition-colors">
                                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                                                        <ShieldCheck className="h-4 w-4 text-green-600" />
                                                        Key Features
                                                    </h3>
                                                    <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-90" />
                                                </summary>
                                                <div className="p-4 bg-gray-50/30">
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedProduct.features && selectedProduct.features.length > 0 ? (
                                                            selectedProduct.features.map((feature, idx) => (
                                                                <Badge key={idx} variant="secondary" className="bg-white hover:bg-white text-gray-700 border border-gray-200 font-normal px-2.5 py-1">
                                                                    {feature}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-400 italic text-sm">No specific features listed.</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </details>

                                            <details className="group bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                                <summary className="px-4 py-3 bg-white border-b border-gray-50 flex items-center justify-between cursor-pointer list-none select-none hover:bg-gray-50/50 transition-colors">
                                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                                                        <Thermometer className="h-4 w-4 text-green-600" />
                                                        Storage & Freshness
                                                    </h3>
                                                    <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-90" />
                                                </summary>
                                                <div className="p-4 bg-gray-50/30 space-y-3 text-sm">
                                                    {selectedProduct.freshnessGuarantee && (
                                                        <div className="flex justify-between items-center border-b border-gray-200/60 pb-2 border-dashed">
                                                            <span className="text-gray-500 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>Freshness</span>
                                                            <span className="font-medium text-green-700">{selectedProduct.freshnessGuarantee}</span>
                                                        </div>
                                                    )}
                                                    {selectedProduct.storageInstructions && (
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-500 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>Storage</span>
                                                            <span className="font-medium text-blue-700">{selectedProduct.storageInstructions}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </details>

                                            <details className="group bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                                <summary className="px-4 py-3 bg-white border-b border-gray-50 flex items-center justify-between cursor-pointer list-none select-none hover:bg-gray-50/50 transition-colors">
                                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                                                        <Store className="h-4 w-4 text-green-600" />
                                                        Seller Information
                                                    </h3>
                                                    <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-90" />
                                                </summary>
                                                <div className="p-4 bg-gray-50/30 space-y-3 text-sm">
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <span className="text-gray-500">Store Name</span>
                                                        <span className="col-span-2 font-medium">{selectedProduct.storeName}</span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <span className="text-gray-500">Seller Name</span>
                                                        <span className="col-span-2 font-medium">{selectedProduct.sellerName}</span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <span className="text-gray-500">Address</span>
                                                        <span className="col-span-2 text-gray-600">{selectedProduct.storeAddress}</span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2 items-center">
                                                        <span className="text-gray-500">Seller ID</span>
                                                        <Badge variant="outline" className="col-span-2 w-fit bg-gray-100 text-gray-600 border-gray-200 font-mono text-[10px]">
                                                            {selectedProduct.sellerUniqueId}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </details>

                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>

                            {/* Footer Section */}
                            <div className="px-6 py-4 bg-white border-t border-gray-100 shrink-0 space-y-4">
                                {/* Metadata Row */}
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs text-gray-400 px-1">
                                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigator.clipboard.writeText(selectedProduct.product_id || selectedProduct._id)}>
                                        <div className="font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100 flex items-center gap-2 hover:bg-gray-100 transition-colors">
                                            <span className="opacity-70"># ID:</span>
                                            <span className="font-medium text-gray-600">{selectedProduct.product_id || selectedProduct._id}</span>
                                            <div className="h-4 w-4 md:w-3 md:h-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Copy className="h-3 w-3" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                        <span>Created: {new Date(selectedProduct.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                </div>

                                {/* Actions Row */}
                                <div className="flex flex-wrap justify-between items-center gap-2 pt-2">
                                    {/* Left side: Close */}
                                    <Button
                                        onClick={() => setOpen(false)}
                                        variant="outline"
                                        className="text-gray-600 shrink-0"
                                    >
                                        Close
                                    </Button>

                                    {/* Right side: action buttons */}
                                    <div className="flex flex-wrap gap-2 justify-end items-center">
                                        {/* Force Inactive Button */}
                                        {(selectedProduct.status === 'active' || selectedProduct.status === 'inactive') && (
                                            confirmAction?.id === selectedProduct._id && confirmAction?.type === 'force-dialog' ? (
                                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                                    <span className="text-sm text-red-700 font-medium">Force to inactive?</span>
                                                    <button onClick={() => { handleForceInactive(selectedProduct._id); setConfirmAction(null); }} className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 font-semibold">Yes, Force</button>
                                                    <button onClick={() => setConfirmAction(null)} className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300">Cancel</button>
                                                </div>
                                            ) : (
                                                <Button
                                                    onClick={() => setConfirmAction({ id: selectedProduct._id, type: 'force-dialog' })}
                                                    className="bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 shrink-0"
                                                    variant="ghost"
                                                >
                                                    <XCircle className="mr-2 h-4 w-4" /> Force Inactive
                                                </Button>
                                            )
                                        )}

                                        {/* Remove Force Inactive */}
                                        {selectedProduct.status === 'forced-inactive' && (
                                            confirmAction?.id === selectedProduct._id && confirmAction?.type === 'restore-dialog' ? (
                                                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                                    <span className="text-sm text-green-700 font-medium">Restore product?</span>
                                                    <button onClick={() => { handleRemoveForceInactive(selectedProduct._id); setConfirmAction(null); }} className="text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 font-semibold">Yes, Restore</button>
                                                    <button onClick={() => setConfirmAction(null)} className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300">Cancel</button>
                                                </div>
                                            ) : (
                                                <Button
                                                    onClick={() => setConfirmAction({ id: selectedProduct._id, type: 'restore-dialog' })}
                                                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 shrink-0"
                                                    variant="ghost"
                                                >
                                                    <RefreshCcw className="mr-2 h-4 w-4" /> Restore
                                                </Button>
                                            )
                                        )}

                                        <Button
                                            onClick={() => selectedProduct && handleReject(selectedProduct._id)}
                                            className="bg-white text-red-600 hover:bg-red-50 border border-red-200 shadow-none shrink-0"
                                            disabled={selectedProduct?.approvalStatus === 'Rejected'}
                                        >
                                            <X className="mr-2 h-4 w-4" /> Reject
                                        </Button>

                                        <Button
                                            onClick={() => selectedProduct && handleApprove(selectedProduct._id)}
                                            className="bg-green-600 hover:bg-green-700 text-white shadow-sm shrink-0"
                                            disabled={selectedProduct?.status === 'active'}
                                        >
                                            <Check className="mr-2 h-4 w-4" /> Approve
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProductApproval;
