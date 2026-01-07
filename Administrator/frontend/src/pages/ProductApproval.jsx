import React, { useState } from 'react';
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
import { Check, X, Eye, Store, Package, Clock, ShieldCheck, Thermometer, Tag, XCircle, Filter, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';
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
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm('Are you sure you want to force this product to inactive?')) {
                                                            handleForceInactive(product._id);
                                                        }
                                                    }}
                                                    title="Force Inactive"
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            )}

                                            {product.status === 'forced-inactive' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm('Are you sure you want to remove force inactive?')) {
                                                            handleRemoveForceInactive(product._id);
                                                        }
                                                    }}
                                                    title="Remove Force Inactive"
                                                >
                                                    <RefreshCcw className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="w-[95vw] max-w-3xl h-[90vh] md:h-auto md:max-h-[90vh] flex flex-col p-0 rounded-xl overflow-hidden">
                    <DialogHeader className="px-4 md:px-6 py-4 border-b bg-white shrink-0">
                        <div className="flex items-center justify-between mr-8">
                            <div>
                                <DialogTitle className="text-lg md:text-xl">Product Details</DialogTitle>
                                <DialogDescription className="text-xs md:text-sm">Review product information before approval</DialogDescription>
                            </div>
                            {selectedProduct && (
                                <div className="hidden md:flex items-center">
                                    <Badge className={`ml-2 ${selectedProduct.status === 'active' ? 'bg-green-100 text-green-700' :
                                        selectedProduct.status === 'forced-inactive' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {selectedProduct.status === 'forced-inactive' ? 'Forced Inactive' :
                                            selectedProduct.status.charAt(0).toUpperCase() + selectedProduct.status.slice(1)}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </DialogHeader>

                    {selectedProduct && (
                        <ScrollArea className="flex-1">
                            <div className="p-4 md:p-6 space-y-6 md:space-y-8">
                                {/* Mobile Status Badge */}
                                <div className="md:hidden">
                                    <Badge className={`w-full justify-center py-1.5 ${selectedProduct.status === 'active' ? 'bg-green-100 text-green-700' :
                                        selectedProduct.status === 'forced-inactive' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {selectedProduct.status === 'forced-inactive' ? 'Forced Inactive' :
                                            selectedProduct.status.charAt(0).toUpperCase() + selectedProduct.status.slice(1)}
                                    </Badge>
                                </div>

                                {/* Images and Basic Info */}
                                <div className="flex flex-col md:grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        {/* Main Image with Navigation */}
                                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border relative group">
                                            <img
                                                src={selectedProduct.images[activeImageIndex]}
                                                alt={selectedProduct.productName}
                                                className="w-full h-full object-cover transition-opacity duration-300"
                                            />
                                            {selectedProduct.images.length > 1 && (
                                                <>
                                                    <button
                                                        onClick={prevImage}
                                                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <ChevronLeft className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={nextImage}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <ChevronRight className="h-5 w-5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Thumbnails */}
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
                                            {selectedProduct.images.map((img, i) => (
                                                <div
                                                    key={i}
                                                    onClick={() => setActiveImageIndex(i)}
                                                    className={`h-16 w-16 md:h-20 md:w-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border cursor-pointer transition-all ${activeImageIndex === i ? 'border-green-500 ring-2 ring-green-500 ring-offset-1' : 'hover:border-green-300'
                                                        }`}
                                                >
                                                    <img src={img} alt="Product" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-xl md:text-2xl font-bold text-gray-900">{selectedProduct.productName}</h2>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                <Badge variant="outline" className="text-sm px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
                                                    {selectedProduct.category}
                                                </Badge>
                                                <span className="text-xs md:text-sm text-gray-500">ID: {selectedProduct._id}</span>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-sm text-gray-600">Price Details</span>
                                                {selectedProduct.discount > 0 && <Badge className="bg-green-600">{selectedProduct.discount}% OFF</Badge>}
                                            </div>
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-2xl md:text-3xl font-bold text-green-700">₹{selectedProduct.sellingPrice}</span>
                                                <span className="text-base md:text-lg text-gray-400 line-through">₹{selectedProduct.originalPrice}</span>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm">
                                                <div>
                                                    <span className="text-gray-500 block">Stock Status</span>
                                                    <span className="font-medium text-gray-900">{selectedProduct.stockQuantity} {selectedProduct.unit} Available</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-gray-500 block">Min Order</span>
                                                    <span className="font-medium text-gray-900">{selectedProduct.minimumOrderQuantity || 1} {selectedProduct.unit}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                                            <p className="text-gray-600 text-sm leading-relaxed">
                                                {selectedProduct.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Specs Grid */}
                                <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-8">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Store className="h-5 w-5 text-gray-500" />
                                            Seller Information
                                        </h3>
                                        <div className="bg-white border rounded-lg p-4 space-y-3">
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                                <span className="text-gray-500">Store Name</span>
                                                <span className="col-span-2 font-medium">{selectedProduct.storeName}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                                <span className="text-gray-500">Seller Name</span>
                                                <span className="col-span-2 font-medium">{selectedProduct.sellerName}</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                                <span className="text-gray-500">Seller ID</span>
                                                <span className="col-span-2 font-family-mono text-xs bg-gray-100 px-2 py-1 rounded w-fit break-all">
                                                    {selectedProduct.sellerUniqueId}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                                <span className="text-gray-500">Address</span>
                                                <span className="col-span-2 text-gray-700">{selectedProduct.storeAddress}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <Package className="h-5 w-5 text-gray-500" />
                                            Product Specifications
                                        </h3>
                                        <div className="bg-white border rounded-lg p-4 space-y-3">
                                            {selectedProduct.meatType && (
                                                <div className="grid grid-cols-2 gap-2 text-sm border-b pb-2">
                                                    <div className="flex items-center gap-2 text-gray-500">
                                                        <Tag className="h-4 w-4" /> Type
                                                    </div>
                                                    <span className="font-medium">{selectedProduct.meatType}</span>
                                                </div>
                                            )}
                                            {selectedProduct.cutType && (
                                                <div className="grid grid-cols-2 gap-2 text-sm border-b pb-2">
                                                    <div className="flex items-center gap-2 text-gray-500">
                                                        <Tag className="h-4 w-4" /> Cut
                                                    </div>
                                                    <span className="font-medium">{selectedProduct.cutType}</span>
                                                </div>
                                            )}
                                            {selectedProduct.preparationTime && (
                                                <div className="grid grid-cols-2 gap-2 text-sm border-b pb-2">
                                                    <div className="flex items-center gap-2 text-gray-500">
                                                        <Clock className="h-4 w-4" /> Prep Time
                                                    </div>
                                                    <span className="font-medium">{selectedProduct.preparationTime}</span>
                                                </div>
                                            )}
                                            {selectedProduct.freshnessGuarantee && (
                                                <div className="grid grid-cols-2 gap-2 text-sm border-b pb-2">
                                                    <div className="flex items-center gap-2 text-gray-500">
                                                        <ShieldCheck className="h-4 w-4" /> Freshness
                                                    </div>
                                                    <span className="font-medium text-green-600">{selectedProduct.freshnessGuarantee}</span>
                                                </div>
                                            )}
                                            {selectedProduct.storageInstructions && (
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div className="flex items-center gap-2 text-gray-500">
                                                        <Thermometer className="h-4 w-4" /> Storage
                                                    </div>
                                                    <span className="font-medium text-blue-600">{selectedProduct.storageInstructions}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    )}

                    <div className="p-4 md:p-6 border-t bg-gray-50 flex flex-col-reverse md:flex-row justify-end gap-3 shrink-0">
                        <Button
                            onClick={() => setOpen(false)}
                            variant="outline"
                            className="w-full md:w-auto h-11 md:h-10"
                        >
                            Cancel
                        </Button>

                        {/* Force Inactive Button in Dialog */}
                        {selectedProduct && (selectedProduct.status === 'active' || selectedProduct.status === 'inactive') && (
                            <Button
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to force this product to inactive?')) {
                                        handleForceInactive(selectedProduct._id);
                                    }
                                }}
                                className="bg-red-100 text-red-600 hover:bg-red-200 border-red-200 w-full md:w-auto h-11 md:h-10"
                                variant="outline"
                            >
                                <XCircle className="mr-2 h-4 w-4" /> Force Inactive
                            </Button>
                        )}
                        {/* Remove Force Inactive Button in Dialog */}
                        {selectedProduct && selectedProduct.status === 'forced-inactive' && (
                            <Button
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to remove force inactive?')) {
                                        handleRemoveForceInactive(selectedProduct._id);
                                    }
                                }}
                                className="bg-green-100 text-green-600 hover:bg-green-200 border-green-200 w-full md:w-auto h-11 md:h-10"
                                variant="outline"
                            >
                                <RefreshCcw className="mr-2 h-4 w-4" /> Remove Force Inactive
                            </Button>
                        )}

                        <Button
                            onClick={() => selectedProduct && handleReject(selectedProduct._id)}
                            className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-none w-full md:w-auto h-11 md:h-10"
                            disabled={selectedProduct?.approvalStatus === 'Rejected'}
                        >
                            <X className="mr-2 h-4 w-4" /> Reject Product
                        </Button>
                        <Button
                            onClick={() => selectedProduct && handleApprove(selectedProduct._id)}
                            className="bg-green-600 hover:bg-green-700 text-white shadow-sm w-full md:w-auto h-11 md:h-10"
                            disabled={selectedProduct?.status === 'active'}
                        >
                            <Check className="mr-2 h-4 w-4" /> Approve Product
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProductApproval;
