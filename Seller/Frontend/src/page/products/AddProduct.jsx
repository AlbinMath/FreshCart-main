import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { Label } from '@/ui/label';
import { Textarea } from '@/ui/textarea';
import { Plus, Trash2, Save, ArrowLeft, Loader2, UploadCloud, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, AlertDescription } from '@/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Switch } from "@/ui/switch";

const CATEGORY_MAPPING = {
    "Fresh Vegetables": "Vegetables",
    "Fresh Fruits": "Fruits",
    "Meat & Poultry": "Meat",
    "Seafood": "Seafood",
    "Dairy Products": "Dairy",
    "Others": "Others"
};

const REVERSE_CATEGORY_MAPPING = {
    "Vegetables": "Fresh Vegetables",
    "Fruits": "Fresh Fruits",
    "Meat": "Meat & Poultry",
    "Seafood": "Seafood",
    "Dairy": "Dairy Products",
    "Others": "Others"
};

const CATEGORY_SPECIFIC_OPTIONS = {
    "Meat": {
        typeLabel: "Meat Type",
        types: ["Chicken", "Mutton", "Lamb", "Pork", "Duck", "Turkey", "Quail", "Other"],
        cuts: ["Whole Bird", "Curry Cut", "Boneless", "Drumstick", "Thigh", "Wings", "Keema (Minced)", "Chops", "Liver/Gizzard", "Ribs"]
    },
    "Seafood": {
        typeLabel: "Seafood Type",
        types: ["Seawater Fish", "Freshwater Fish", "Prawns", "Shrimp", "Crab", "Lobster", "Squid/Calamari", "Shellfish", "Other"],
        cuts: ["Whole Cleaned", "Whole Uncleaned", "Fillet", "Steaks", "Curry Cut", "Headless", "Peeled & Deveined", "Rings"]
    }
};

const AddProduct = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get Product ID from URL
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Image State
    const [imageFiles, setImageFiles] = useState([]); // New files to upload
    const [imagePreviews, setImagePreviews] = useState([]); // Previews for ALL (existing + new)
    const [existingImages, setExistingImages] = useState([]); // URLs of images already on server

    // Form State
    const [formData, setFormData] = useState({
        productName: '',
        description: '',
        category: '',
        sellingPrice: '',
        originalPrice: '',
        discount: '',
        quantity: '',
        unit: '',
        minimumOrderQuantity: '1',
        stockQuantity: '',
        lowStockThreshold: '10',
        preparationTime: '',
        cutType: '',
        meatType: '',
        freshnessGuarantee: '',
        storageInstructions: '',
        shelfLife: '',
        status: 'active', // Default status
    });

    // Features State
    const [features, setFeatures] = useState([{ key: '', value: '' }]);

    // Allowed Categories State
    const [allowedCategories, setAllowedCategories] = useState([]);

    // Fetch Seller Profile to get Allowed Categories
    useEffect(() => {
        const fetchSellerProfile = async () => {
            const sellerInfoStr = localStorage.getItem('sellerInfo');
            if (!sellerInfoStr) return;

            const parsed = JSON.parse(sellerInfoStr);
            const initialData = parsed.user || parsed;
            const sellerId = initialData._id;

            if (sellerId) {
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/seller/profile/${sellerId}`);
                    if (response.ok) {
                        const sellerData = await response.json();
                        const profileCategories = sellerData.productCategories || [];

                        // Map profile categories to form values
                        const mappedCategories = profileCategories
                            .map(cat => CATEGORY_MAPPING[cat])
                            .filter(Boolean); // Remove undefined if mapping fails

                        setAllowedCategories(mappedCategories);
                    }
                } catch (err) {
                    console.error("Failed to fetch seller profile", err);
                }
            }
        };
        fetchSellerProfile();
    }, []);

    // Fetch Data for Edit Mode
    useEffect(() => {
        if (isEditMode) {
            const fetchProduct = async () => {
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/products/${id}`);
                    if (!response.ok) {
                        throw new Error('Product not found');
                    }
                    const product = await response.json();

                    setFormData({
                        productName: product.productName || '',
                        description: product.description || '',
                        category: product.category || '',
                        sellingPrice: product.sellingPrice || '',
                        originalPrice: product.originalPrice || '',
                        discount: product.discount || '',
                        quantity: product.quantity || '',
                        unit: product.unit || '',
                        minimumOrderQuantity: product.minimumOrderQuantity || '1',
                        stockQuantity: product.stockQuantity || '',
                        lowStockThreshold: product.lowStockThreshold || '10',
                        preparationTime: product.preparationTime || '',
                        cutType: product.cutType || '',
                        meatType: product.meatType || '',
                        freshnessGuarantee: product.freshnessGuarantee || '',
                        storageInstructions: product.storageInstructions || '',
                        shelfLife: product.shelfLife || '',
                        status: product.status || 'active',
                    });

                    if (product.status === 'forced-inactive') {
                        setError("This product has been flagged as forced-inactive by the admin and cannot be edited.");
                        setTimeout(() => navigate('/products'), 3000);
                        return;
                    }

                    if (product.features && product.features.length > 0) {
                        setFeatures(product.features);
                    }

                    // Handle Images
                    let currentImages = [];
                    if (product.images && product.images.length > 0) {
                        currentImages = product.images;
                    } else if (product.image) {
                        // Fallback for old single image
                        currentImages = [product.image];
                    }
                    setExistingImages(currentImages);
                    setImagePreviews(currentImages);

                } catch (err) {
                    console.error("Failed to fetch product", err);
                    setError("Failed to load product details.");
                }
            }
            fetchProduct();
        }
    }, [id, isEditMode]);


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // If category changes, reset specific fields
            if (name === 'category') {
                newData.meatType = '';
                newData.cutType = '';
            }
            return newData;
        });
    };

    // Image Handlers
    const handleAddImage = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (imagePreviews.length >= 5) {
            setError("Maximum 5 images allowed.");
            return;
        }

        // Use functional update to avoid stale closure
        setImageFiles(prev => [...prev, file]);

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreviews(prev => [...prev, reader.result]);
        };
        reader.readAsDataURL(file);

        // Reset so same file can be re-selected
        e.target.value = '';
    };

    const removeImage = (index) => {
        const previewToRemove = imagePreviews[index];

        // Check if it's an existing URL
        if (existingImages.includes(previewToRemove)) {
            setExistingImages(existingImages.filter(img => img !== previewToRemove));
        } else {
            // It is a new file
            // We need to find which file in 'imageFiles' corresponds to this preview
            // Since we can't easily map preview back to file index if mixed, 
            // we rely on the fact that new files are appended after existing ones in logic?
            // Actually, simplest is:
            // Calculate how many existing images are currently in the list
            // But wait, existingImages state tracks what we WANT to keep.

            // Let's assume:
            // imagePreviews = [...(images we kept), ...(new file previews)]
            // So if index < existingImages.length, it's one of the existing ones (assuming order preserved)
            // But if we delete an earlier existing one, existingImages shrinks.

            // To be safe, we rebuild previews every render? No.

            // Better logic:
            // If preview string starts with "data:", it's a new file.
            // If it starts with "http", it's existing.

            if (previewToRemove.startsWith('data:')) {
                // It's a new file
                // Find index within the new files array?
                // The new files array corresponds to the "data:" entries in imagePreviews

                // Get all "data:" previews up to this point to find index
                const dataPreviewsBefore = imagePreviews.slice(0, index).filter(p => p.startsWith('data:'));
                const fileIndex = dataPreviewsBefore.length;

                const newFiles = [...imageFiles];
                newFiles.splice(fileIndex, 1);
                setImageFiles(newFiles);
            } else {
                // It's existing
                setExistingImages(existingImages.filter(img => img !== previewToRemove));
            }
        }

        setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    };

    // Features Handlers
    const handleFeatureChange = (index, field, value) => {
        const newFeatures = [...features];
        newFeatures[index][field] = value;
        setFeatures(newFeatures);
    };

    const addFeature = () => {
        setFeatures([...features, { key: '', value: '' }]);
    };

    const removeFeature = (index) => {
        const newFeatures = features.filter((_, i) => i !== index);
        setFeatures(newFeatures);
    };

    const handleSubmit = async (forcedStatus = null) => {
        setLoading(true);
        setError('');

        try {
            const sellerInfoStr = localStorage.getItem('sellerInfo');
            if (!sellerInfoStr) throw new Error("Seller info not found. Please login again.");

            const sellerInfo = JSON.parse(sellerInfoStr);
            const seller = sellerInfo.user || sellerInfo;

            const formDataToSend = new FormData();

            // Append all form fields
            Object.keys(formData).forEach(key => {
                if (key !== 'status' && formData[key] !== undefined && formData[key] !== null) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Status
            // If forcedStatus is provided (e.g. 'draft'), use it. 
            // Otherwise use the value from the form (which follows the switch for active/inactive).
            // However, 'Publish Product' button previously sent 'active'. 
            // We want 'Publish' to mean 'Save State', so if it's inactive in form, it saves as inactive.
            const statusToSend = forcedStatus || formData.status;
            formDataToSend.append('status', statusToSend);

            // Features
            formDataToSend.append('features', JSON.stringify(features.filter(f => f.key && f.value)));

            // Seller Info
            formDataToSend.append('sellerId', seller._id);
            formDataToSend.append('sellerName', seller.sellerName || seller.name);
            formDataToSend.append('storeName', seller.storeName);
            formDataToSend.append('storeAddress', seller.storeAddress);
            formDataToSend.append('sellerUniqueId', seller.sellerUniqueId || 'TEMP_ID'); // Fallback handled by backend if missing

            // Images
            // 1. Existing (send as JSON string or individual fields)
            // Backend expects 'existingImages' possibly as array or single value.
            // If we append multiple times, express/multer often sees it as array.
            // But let's stringify to be safe if backend logic we wrote handles string parsing
            formDataToSend.append('existingImages', JSON.stringify(existingImages));

            // 2. New
            imageFiles.forEach(file => {
                formDataToSend.append('images', file);
            });

            const url = isEditMode
                ? `${import.meta.env.VITE_API_URL}/products/update/${id}`
                : `${import.meta.env.VITE_API_URL}/products/add`;

            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                body: formDataToSend,
            });

            const data = await response.json();

            if (response.ok) {
                navigate('/products');
            } else {
                setError(data.message || 'Failed to save product');
            }
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            <div className="flex items-center justify-between">
                <Button variant="ghost" className="text-gray-600" onClick={() => navigate('/products')}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Catalog
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/products')}>Cancel</Button>
                    {/* Only show 'Save as Draft' if not editing? Or both? User choice. */}
                    <Button variant="secondary" onClick={() => handleSubmit('draft')} disabled={loading}>
                        Save as Draft
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleSubmit()} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditMode ? 'Update Product' : 'Publish Product'}
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column - Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle>Product Details</CardTitle>
                                <CardDescription>Basic information about your product.</CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="product-status"
                                    checked={formData.status === 'active'}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked ? 'active' : 'inactive' }))}
                                />
                                <Label htmlFor="product-status" className={formData.status === 'active' ? "text-green-600" : "text-gray-500"}>
                                    {formData.status === 'active' ? 'Active' : 'Inactive'}
                                </Label>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Product Name</Label>
                                <Input name="productName" placeholder="e.g. Fresh Curry Cut Chicken" required value={formData.productName} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea name="description" placeholder="Describe the product..." required className="h-24" value={formData.description} onChange={handleChange} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select name="category" required value={formData.category} onValueChange={(val) => handleSelectChange('category', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allowedCategories.length > 0 ? (
                                                allowedCategories.map(catValue => (
                                                    <SelectItem key={catValue} value={catValue}>
                                                        {REVERSE_CATEGORY_MAPPING[catValue] || catValue}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="disabled" disabled>No categories allowed in profile</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {CATEGORY_SPECIFIC_OPTIONS[formData.category] && (
                                    <div className="space-y-2">
                                        <Label>{CATEGORY_SPECIFIC_OPTIONS[formData.category].typeLabel} (Optional)</Label>
                                        <Select name="meatType" value={formData.meatType} onValueChange={(val) => handleSelectChange('meatType', val)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={`Select ${CATEGORY_SPECIFIC_OPTIONS[formData.category].typeLabel}`} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CATEGORY_SPECIFIC_OPTIONS[formData.category].types.map(type => (
                                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing & Inventory</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Selling Price (₹)</Label>
                                    <Input type="number" name="sellingPrice" required placeholder="0.00" value={formData.sellingPrice} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>MRP (Optional)</Label>
                                    <Input type="number" name="originalPrice" placeholder="0.00" value={formData.originalPrice} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Discount (%)</Label>
                                    <Input type="number" name="discount" placeholder="0" value={formData.discount} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Available Stock (Qty)</Label>
                                    <Input type="number" name="stockQuantity" required placeholder="0" value={formData.stockQuantity} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Low Stock Alert (Qty)</Label>
                                    <Input type="number" name="lowStockThreshold" placeholder="10" value={formData.lowStockThreshold} onChange={handleChange} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Specifications</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Quantity per Unit</Label>
                                    <Input name="quantity" type="number" required placeholder="1" value={formData.quantity} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Unit</Label>
                                    <Input name="unit" required placeholder="kg, gm, pc" value={formData.unit} onChange={handleChange} />
                                </div>

                                <div className="space-y-2">
                                    <Label>Prep Time</Label>
                                    <Input name="preparationTime" placeholder="e.g. 15 mins" value={formData.preparationTime} onChange={handleChange} />
                                </div>
                            </div>

                            {CATEGORY_SPECIFIC_OPTIONS[formData.category] && (
                                <div className="space-y-2">
                                    <Label>Cut Type (Optional)</Label>
                                    <Select name="cutType" value={formData.cutType} onValueChange={(val) => handleSelectChange('cutType', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Cut Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORY_SPECIFIC_OPTIONS[formData.category].cuts.map(cut => (
                                                <SelectItem key={cut} value={cut}>{cut}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Freshness</Label>
                                    <Input name="freshnessGuarantee" placeholder="e.g. 1 Day" value={formData.freshnessGuarantee} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Shelf Life</Label>
                                    <Input name="shelfLife" placeholder="e.g. 2 Days" value={formData.shelfLife} onChange={handleChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Storage</Label>
                                    <Input name="storageInstructions" placeholder="e.g. Keep Frozen" value={formData.storageInstructions} onChange={handleChange} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Media & Updates */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Images</CardTitle>
                            <CardDescription>Upload images one by one (Max 5).</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative aspect-square border rounded-md overflow-hidden group">
                                        <img src={preview} alt="Product" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button variant="destructive" size="icon" onClick={() => removeImage(index)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {imagePreviews.length < 5 && (
                                    <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                                        <Plus className="h-8 w-8 text-gray-400 mb-2" />
                                        <span className="text-xs text-gray-500 font-medium">Add Image</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAddImage} />
                                    </label>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Product Features</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {features.map((feature, index) => (
                                <div key={index} className="flex gap-2">
                                    <Input placeholder="Feature" value={feature.key} onChange={(e) => handleFeatureChange(index, 'key', e.target.value)} />
                                    <Input placeholder="Value" value={feature.value} onChange={(e) => handleFeatureChange(index, 'value', e.target.value)} />
                                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500" onClick={() => removeFeature(index)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" className="w-full" onClick={addFeature}>
                                <Plus className="h-3 w-3 mr-2" /> Add Feature
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AddProduct;
