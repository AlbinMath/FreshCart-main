import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/ui/card';
import { Button } from '@/ui/button';
import { Plus, Package, Search, Eye, Star, Download, UploadCloud, Trash2, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { useNavigate } from 'react-router-dom';
import { Input } from '@/ui/input';
import ProductDetailsDialog from './ProductDetailsDialog';
import ProductImageSlider from './ProductImageSlider';
import ProductReviewsDialog from './ProductReviewsDialog';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/ui/alert-dialog";
import { Check, X, Pencil } from 'lucide-react';

const StockEditor = ({ productId, initialStock, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [stock, setStock] = useState(initialStock);
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (stock === initialStock) {
            setIsEditing(false);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/products/stock/${productId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ stockQuantity: stock }),
            });

            if (response.ok) {
                const updatedProduct = await response.json();
                onUpdate(updatedProduct.stockQuantity);
                toast.success("Stock updated");
                setIsEditing(false);
            } else {
                toast.error("Failed to update stock");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error updating stock");
        } finally {
            setLoading(false);
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1">
                <Input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="h-7 w-20 px-2 py-1 text-xs"
                    autoFocus
                />
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={handleSave}
                    disabled={loading}
                >
                    <Check className="h-3 w-3" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                        setIsEditing(false);
                        setStock(initialStock);
                    }}
                    disabled={loading}
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>
        );
    }

    return (
        <div
            className={`text-xs font-semibold px-2 py-1 rounded cursor-pointer flex items-center gap-1 group transition-colors ${stock <= 10
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : stock <= 50
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
            onClick={() => setIsEditing(true)}
            title="Click to edit stock"
        >
            <span>Stock: {stock}</span>
            <Pencil className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};

const ProductCatalog = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isReviewsOpen, setIsReviewsOpen] = useState(false);

    // Dialog States
    const [deleteId, setDeleteId] = useState(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
    const [deleteAllConfirmation, setDeleteAllConfirmation] = useState("");

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                let sellerInfo = JSON.parse(localStorage.getItem('sellerInfo') || '{}');
                let seller = sellerInfo.user || sellerInfo;
                let uniqueId = seller.sellerUniqueId;

                // If Unique ID is missing, try to fetch it from backend using Seller ID
                if (!uniqueId && seller._id) {
                    try {
                        const profileResponse = await fetch(`${import.meta.env.VITE_API_URL}/seller/profile/${seller._id}`);
                        if (profileResponse.ok) {
                            const freshProfile = await profileResponse.json();
                            uniqueId = freshProfile.sellerUniqueId;

                            // Update local storage
                            if (uniqueId) {
                                if (sellerInfo.user) sellerInfo.user = freshProfile;
                                else Object.assign(sellerInfo, freshProfile);
                                localStorage.setItem('sellerInfo', JSON.stringify(sellerInfo));
                            }
                        }
                    } catch (err) {
                        console.error("Failed to fetch fresh profile", err);
                    }
                }

                if (!uniqueId) {
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${import.meta.env.VITE_API_URL}/products/seller/${uniqueId}`);
                if (response.ok) {
                    const data = await response.json();
                    setProducts(data);
                }
            } catch (error) {
                console.error("Failed to load products", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // CSV Handling
    const handleExportCSV = () => {
        if (products.length === 0) return;

        // Define headers
        const headers = [
            "Product Name", "Description", "Category", "Selling Price", "MRP", "Discount",
            "Quantity per Unit", "Unit", "Low Stock Alert", "Preparation Time",
            "Meat Type", "Cut Type", "Freshness", "Shelf Life", "Storage", "Features", "Status"
        ];

        // Map data
        const csvRows = [headers.join(',')];

        products.forEach(p => {
            // Format features as "Key:Value;Key:Value"
            const featuresStr = p.features
                ? p.features.map(f => `${f.key}:${f.value}`).join(';')
                : '';

            const row = [
                `"${p.productName || ''}"`,
                `"${(p.description || '').replace(/"/g, '""')}"`, // Escape quotes
                `"${p.category || ''}"`,
                p.sellingPrice || 0,
                p.originalPrice || '',
                p.discount || 0,
                p.quantity || 1,
                `"${p.unit || ''}"`,
                // Stock removed
                p.lowStockThreshold || 10,
                `"${p.preparationTime || ''}"`,
                `"${p.meatType || ''}"`,
                `"${p.cutType || ''}"`,
                `"${p.freshnessGuarantee || ''}"`,
                `"${p.shelfLife || ''}"`,
                `"${p.storageInstructions || ''}"`,
                `"${featuresStr.replace(/"/g, '""')}"`,
                p.status || 'active'
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_catalog_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImportCSV = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            const rows = text.split('\n');
            const headers = rows[0].split(',').map(h => h.trim());

            const newProducts = [];
            const sellerInfo = JSON.parse(localStorage.getItem('sellerInfo') || '{}');
            const seller = sellerInfo.user || sellerInfo;

            if (!seller._id || !seller.sellerUniqueId) {
                toast.error("Seller info missing. Please login again.");
                return;
            }

            // Simple CSV parser (doesn't handle commas inside quotes perfectly, but good enough for simple usage)
            // Ideally use a library, but sticking to native for now to avoid large deps if possible
            // Or use a split regex that respects quotes: /,(?=(?:(?:[^"]*"){2})*[^"]*$)/

            for (let i = 1; i < rows.length; i++) {
                if (!rows[i].trim()) continue;

                // Regex to split by comma, ignoring commas in quotes
                const values = rows[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                // The above regex is imperfect. Let's try a better split approach or simple split if we assume safe input
                // Fallback to simple split for now, user instruction: "Avoid commas in descriptions if possible for bulk upload without advanced parser"
                // Actually, let's try the complex regex
                const rowData = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

                if (rowData.length < 3) continue; // Skip invalid rows

                // Headers: Name, Desc, Cat, Price, MRP, Disc, Qty, Unit, LowStock, Prep, Meat, Cut, Fresh, Shelf, Storage, Features, Status

                // Parse Features: "Key:Value;Key2:Value2"
                let parsedFeatures = [];
                if (rowData[15]) {
                    try {
                        parsedFeatures = rowData[15].split(';').map(pair => {
                            const [key, value] = pair.split(':');
                            if (key && value) return { key: key.trim(), value: value.trim() };
                            return null;
                        }).filter(Boolean);
                    } catch (e) {
                        console.error("Error parsing features CSV", e);
                    }
                }

                const product = {
                    productName: rowData[0],
                    description: rowData[1],
                    category: rowData[2],
                    sellingPrice: parseFloat(rowData[3]) || 0,
                    originalPrice: parseFloat(rowData[4]) || 0,
                    discount: parseFloat(rowData[5]) || 0,
                    quantity: parseFloat(rowData[6]) || 1,
                    unit: rowData[7],
                    stockQuantity: 0, // Default to 0 since removed from CSV
                    lowStockThreshold: parseInt(rowData[8]) || 10,
                    preparationTime: rowData[9],
                    meatType: rowData[10],
                    cutType: rowData[11],
                    freshnessGuarantee: rowData[12],
                    shelfLife: rowData[13],
                    storageInstructions: rowData[14],
                    features: parsedFeatures,
                    status: rowData[16] || 'active',

                    // Inject Seller Info
                    sellerId: seller._id,
                    sellerName: seller.sellerName || seller.name,
                    storeName: seller.storeName,
                    storeAddress: seller.storeAddress,
                    sellerUniqueId: seller.sellerUniqueId
                };
                newProducts.push(product);
            }

            if (newProducts.length > 0) {
                setLoading(true);
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/products/bulk-add`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ products: newProducts })
                    });

                    const result = await response.json();
                    if (response.ok) {
                        toast.success(`Successfully added ${result.addedCount} products.`);
                        if (result.errors && result.errors.length > 0) {
                            console.error("Import Errors:", result.errors);
                            toast.warning(`Completed with some errors`, {
                                description: result.errors.map(e => `${e.name}: ${e.error}`).join('\n')
                            });
                        }
                        setTimeout(() => window.location.reload(), 1500);
                    } else {
                        toast.error(`Failed: ${result.message}`);
                    }
                } catch (err) {
                    console.error("Bulk upload failed", err);
                    toast.error("Error uploading products.");
                } finally {
                    setLoading(false);
                }
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    };

    const confirmDeleteProduct = (id) => {
        setDeleteId(id);
        setShowDeleteDialog(true);
    };

    const handleDeleteProduct = async () => {
        if (!deleteId) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/products/delete/${deleteId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setProducts(products.filter(p => p._id !== deleteId));
                toast.success("Product deleted successfully");
                setShowDeleteDialog(false);
            } else {
                toast.error("Failed to delete product");
            }
        } catch (error) {
            console.error("Error deleting product:", error);
            toast.error("Error deleting product");
        }
    };

    const confirmDeleteAll = () => {
        setDeleteAllConfirmation("");
        setShowDeleteAllDialog(true);
    };

    const handleDeleteAll = async () => {
        if (deleteAllConfirmation !== 'DELETE ALL') {
            toast.error("Please type 'DELETE ALL' to confirm.");
            return;
        }

        try {
            let sellerInfo = JSON.parse(localStorage.getItem('sellerInfo') || '{}');
            let seller = sellerInfo.user || sellerInfo;
            let uniqueId = seller.sellerUniqueId;

            if (!uniqueId) {
                toast.error("Seller ID not found");
                return;
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL}/products/delete-all/${uniqueId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setProducts([]);
                toast.success("All products have been deleted.");
                setShowDeleteAllDialog(false);
            } else {
                toast.error("Failed to delete products");
            }
        } catch (error) {
            console.error("Error deleting all products:", error);
            toast.error("Error executing bulk delete");
        }
    };

    const handleImageUpload = async (productId, file) => {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/products/image/${productId}`, {
                method: 'PATCH',
                body: formData,
            });

            if (response.ok) {
                const updatedProduct = await response.json();
                setProducts(products.map(p =>
                    p._id === productId ? updatedProduct : p
                ));
                toast.success("Image uploaded successfully");
            } else {
                toast.error("Failed to upload image");
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            toast.error("Error uploading image");
        }
    };

    const filteredProducts = products.filter(p =>
        p.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Product Catalog</h2>
                    <p className="text-gray-500">Manage your store's inventory and offerings.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="destructive" onClick={confirmDeleteAll}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete All
                    </Button>
                    <Button variant="outline" onClick={handleExportCSV}>
                        <Download className="h-4 w-4 mr-2" /> Format CSV / Download
                    </Button>
                    <label className="inline-flex">
                        <Button variant="secondary" className="cursor-pointer" asChild>
                            <span>
                                <UploadCloud className="h-4 w-4 mr-2" /> Upload CSV
                            </span>
                        </Button>
                        <input
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleImportCSV}
                        />
                    </label>
                    <Button onClick={() => navigate('/products/add')} className="bg-green-600 hover:bg-green-700">
                        <Plus className="h-4 w-4 mr-2" /> Add New Product
                    </Button>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm max-w-md">
                <Search className="h-5 w-5 text-gray-400 ml-2" />
                <Input
                    placeholder="Search products..."
                    className="border-none shadow-none focus-visible:ring-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Product List */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No Products Found</h3>
                    <p className="text-gray-500 mb-6">Get started by adding your first product to the catalog.</p>
                    <Button onClick={() => navigate('/products/add')} variant="outline">
                        Add Product
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                        <Card key={product._id} className="overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                            <ProductImageSlider
                                images={product.images}
                                fallbackImage={product.image}
                                alt={product.productName}
                                onUpload={(file) => handleImageUpload(product._id, file)}
                            />
                            <CardContent className="p-0 flex-1 flex flex-col">
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">{product.productName}</h3>
                                        <span className="font-bold text-green-600">₹{product.sellingPrice}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">{product.description}</p>


                                    <div className="flex items-center justify-between gap-2 mb-4">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded flex-1">
                                            <Package className="h-3 w-3" />
                                            <span>{product.quantity} {product.unit}</span>
                                        </div>
                                        <StockEditor
                                            productId={product._id}
                                            initialStock={product.stockQuantity}
                                            onUpdate={(newStock) => {
                                                setProducts(products.map(p =>
                                                    p._id === product._id ? { ...p, stockQuantity: newStock } : p
                                                ));
                                            }}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2 pt-2 border-t mt-auto">
                                        <span className="text-xs text-gray-400">ID: {product.product_id || product._id.slice(-6)}</span>
                                        <div className="flex items-center justify-between gap-1">
                                            {product.status === 'forced-inactive' ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-gray-400 cursor-not-allowed"
                                                    disabled
                                                    title="This product has been flagged as forced-inactive by the admin."
                                                >
                                                    Edit Unavailable
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => navigate(`/products/edit/${product._id}`)}
                                                >
                                                    Edit Details
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                                onClick={() => {
                                                    setSelectedProduct(product);
                                                    setIsDetailsOpen(true);
                                                }}
                                            >
                                                <Eye className="h-4 w-4 mr-1" /> View
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                                onClick={() => {
                                                    setSelectedProduct(product);
                                                    setIsReviewsOpen(true);
                                                }}
                                            >
                                                <Star className="h-4 w-4 mr-1" /> Reviews
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => confirmDeleteProduct(product._id)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-1" /> Delete
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent >
                        </Card >
                    ))}
                </div >
            )
            }

            <ProductDetailsDialog
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                product={selectedProduct}
            />

            <ProductReviewsDialog
                open={isReviewsOpen}
                onOpenChange={setIsReviewsOpen}
                product={selectedProduct}
            />

            {/* Single Delete Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the product from your catalog.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteProduct} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete All Dialog */}
            <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" /> Delete All Products
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete <strong>ALL</strong> products from your catalog.
                            <br /><br />
                            Please type <strong>DELETE ALL</strong> below to confirm.
                        </AlertDialogDescription>
                        <div className="mt-4">
                            <Input
                                value={deleteAllConfirmation}
                                onChange={(e) => setDeleteAllConfirmation(e.target.value)}
                                placeholder="Type DELETE ALL"
                                className="border-red-200 focus-visible:ring-red-500"
                            />
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAll}
                            disabled={deleteAllConfirmation !== 'DELETE ALL'}
                        >
                            Delete All Products
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    );
};

export default ProductCatalog;
