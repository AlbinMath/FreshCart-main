import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/ui/card';
import { Button } from '@/ui/button';
import { Plus, Package, Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/ui/input';
import ProductDetailsDialog from './ProductDetailsDialog';
import ProductImageSlider from './ProductImageSlider';

const ProductCatalog = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

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
                <Button onClick={() => navigate('/products/add')} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" /> Add New Product
                </Button>
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
                        <Card key={product._id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <ProductImageSlider
                                images={product.images}
                                fallbackImage={product.image}
                                alt={product.productName}
                            />
                            <CardContent className="p-0">
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">{product.productName}</h3>
                                        <span className="font-bold text-green-600">₹{product.sellingPrice}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-4">{product.description}</p>

                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded">
                                        <Package className="h-3 w-3" />
                                        <span>{product.weight} {product.weightDescription}</span>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <span className="text-xs text-gray-400">ID: {product._id.slice(-6)}</span>
                                        {product.status === 'forced-inactive' ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-gray-400 cursor-not-allowed hover:bg-transparent"
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
                                            <Eye className="h-4 w-4 mr-1" /> View Details
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )
            }

            <ProductDetailsDialog
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                product={selectedProduct}
            />
        </div >
    );
};

export default ProductCatalog;
