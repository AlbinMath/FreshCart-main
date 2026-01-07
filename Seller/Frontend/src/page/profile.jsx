import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { User, Store, Phone, Mail, MapPin, Truck, Clock, Briefcase, FileText, CreditCard, Smartphone, Fingerprint, Tags } from 'lucide-react';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge'; // Ensure Badge is imported or use standard tailwind
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const navigate = useNavigate();
    const [seller, setSeller] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        businessType: '',
        storeAddress: '',
        pinCode: '',
        operatingHours: '',
        productCategories: [],
        contactPersonName: '',
        deliveryMethod: '',
        bankAccountHolderName: '',
        bankAccountNumber: '',
        ifscCode: '',
        upiId: ''
    });

    const CATEGORY_OPTIONS = [
        "Fresh Vegetables",
        "Fresh Fruits",
        "Dairy Products",
        "Meat & Poultry",
        "Seafood",
        "Others"
    ];

    const BUSINESS_TYPES = [
        "Individual",
        "Partnership",
        "Private Limited",
        "Sole Proprietorship"
    ];

    const formatHoursForDisplay = (hours) => {
        if (!hours) return 'Not Provided';
        if (typeof hours === 'string') return hours;
        if (Array.isArray(hours)) {
            // Find today's hours or just say "Schedule Set"
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const today = days[new Date().getDay()];
            const todaySchedule = hours.find(h => h.day === today);
            if (todaySchedule) {
                return todaySchedule.isClosed ? `Today: Closed` : `Today: ${todaySchedule.open} - ${todaySchedule.close}`;
            }
            return 'Schedule Available';
        }
        return 'Invalid Format';
    };

    useEffect(() => {
        const fetchProfile = async () => {
            const storedInfo = localStorage.getItem('sellerInfo');
            if (storedInfo) {
                try {
                    const parsed = JSON.parse(storedInfo);
                    // Initial load from storage to show something immediately
                    const initialData = parsed.user || parsed;
                    setSeller(initialData);

                    // Fetch fresh data
                    const id = initialData._id;
                    if (id) {
                        const response = await fetch(`${import.meta.env.VITE_API_URL}/seller/profile/${id}`);
                        if (response.ok) {
                            const freshData = await response.json();
                            setSeller(freshData);

                            // Update localStorage with fresh data to keep it in sync
                            if (parsed.user) {
                                parsed.user = freshData;
                            } else {
                                Object.assign(parsed, freshData);
                            }
                            localStorage.setItem('sellerInfo', JSON.stringify(parsed));

                            // Update formData with fresh data
                            setFormData({
                                sellerId: freshData._id,
                                businessType: freshData.businessType || '',
                                storeAddress: freshData.storeAddress || '',
                                pinCode: freshData.pinCode || '',
                                displayOperatingHours: formatHoursForDisplay(freshData.operatingHours),
                                productCategories: freshData.productCategories || [],
                                contactPersonName: freshData.contactPersonName || '',
                                deliveryMethod: freshData.deliveryMethod || '',
                                bankAccountHolderName: freshData.bankAccountHolderName || '',
                                bankAccountNumber: freshData.bankAccountNumber || '',
                                ifscCode: freshData.ifscCode || '',
                                upiId: freshData.upiId || ''
                            });
                            return; // Exit if fetch successful to avoid double setFormData
                        }
                    }

                    // Fallback to storing initial data in form if fetch failed or no ID
                    setFormData({
                        sellerId: initialData._id,
                        businessType: initialData.businessType || '',
                        storeAddress: initialData.storeAddress || '',
                        pinCode: initialData.pinCode || '',
                        displayOperatingHours: formatHoursForDisplay(initialData.operatingHours),
                        productCategories: initialData.productCategories || [],
                        contactPersonName: initialData.contactPersonName || '',
                        deliveryMethod: initialData.deliveryMethod || '',
                        bankAccountHolderName: initialData.bankAccountHolderName || '',
                        bankAccountNumber: initialData.bankAccountNumber || '',
                        ifscCode: initialData.ifscCode || '',
                        upiId: initialData.upiId || ''
                    });

                } catch (e) {
                    console.error("Failed to load profile", e);
                }
            }
        };

        fetchProfile();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCategoryChange = (category) => {
        setFormData(prev => {
            const current = prev.productCategories || [];
            if (current.includes(category)) {
                return { ...prev, productCategories: current.filter(c => c !== category) };
            } else {
                return { ...prev, productCategories: [...current, category] };
            }
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/seller/update-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setSeller(data); // data should be the updated seller object

                // Update local storage
                const storedInfo = localStorage.getItem('sellerInfo');
                if (storedInfo) {
                    const parsed = JSON.parse(storedInfo);
                    if (parsed.user) {
                        parsed.user = data;
                    } else {
                        // If stored as flat object (unlikely based on login code but handling just in case)
                        Object.assign(parsed, data);
                    }
                    localStorage.setItem('sellerInfo', JSON.stringify(parsed));
                }

                setIsEditing(false);
                // Optional: Show success toast
            } else {
                console.error("Update failed:", data.message);
                alert("Failed to update profile: " + data.message);
            }
        } catch (error) {
            console.error("Error saving profile:", error);
            alert("Error saving profile");
        } finally {
            setSaving(false);
        }
    };

    if (!seller) return <div className="p-8 text-center">Loading Profile...</div>;

    const InfoItem = ({ icon: Icon, label, value }) => (
        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="p-2 bg-white rounded-md shadow-sm text-green-600">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="font-semibold text-gray-900 mt-1">{value || 'Not Provided'}</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Store Profile</h2>
                {!isEditing && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate('/update-password')}>
                            Update Password
                        </Button>
                        <Button onClick={() => setIsEditing(true)} className="bg-green-600 hover:bg-green-700">
                            Edit Profile
                        </Button>
                    </div>
                )}
            </div>

            {/* Main Profile Info */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5 text-green-600" />
                        Basic Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoItem icon={User} label="Seller Name" value={seller.sellerName || seller.name} />
                    <InfoItem icon={Fingerprint} label="Seller Unique ID" value={seller.sellerUniqueId || 'Not Generated'} />

                    {isEditing ? (
                        <div className="p-4 bg-gray-50 rounded-lg space-y-2 border border-green-200">
                            <label className="text-sm font-medium text-gray-700">Business Type</label>
                            <select
                                name="businessType"
                                value={formData.businessType}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="">Select Type</option>
                                {BUSINESS_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <InfoItem icon={Briefcase} label="Business Type" value={seller.businessType} />
                    )}

                    <InfoItem icon={Store} label="Store Name" value={seller.storeName} />

                    {isEditing ? (
                        <div className="md:col-span-2 p-4 bg-gray-50 rounded-lg space-y-2 border border-green-200">
                            <label className="text-sm font-medium text-gray-700">Store Address</label>
                            <textarea
                                name="storeAddress"
                                value={formData.storeAddress}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                                rows="3"
                                placeholder="Enter full store address"
                            />
                            <div className="mt-2">
                                <label className="text-sm font-medium text-gray-700">Pin Code</label>
                                <input
                                    type="text"
                                    name="pinCode"
                                    value={formData.pinCode}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-md mt-1"
                                    placeholder="Enter Pin Code"
                                />
                            </div>
                        </div>
                    ) : (
                        <InfoItem
                            icon={MapPin}
                            label="Address"
                            value={seller.storeAddress && seller.storeAddress.includes(seller.pinCode)
                                ? seller.storeAddress
                                : `${seller.storeAddress || ''}${seller.pinCode ? ' - ' + seller.pinCode : ''}`}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Contact Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-green-600" />
                        Contact Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isEditing ? (
                        <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                            <label className="text-sm font-medium text-gray-700">Contact Person</label>
                            <input
                                type="text"
                                name="contactPersonName"
                                value={formData.contactPersonName}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                    ) : (
                        <InfoItem icon={User} label="Contact Person" value={seller.contactPersonName} />
                    )}
                    <InfoItem icon={Phone} label="Phone Number" value={seller.phoneNumber} />
                    <InfoItem icon={Mail} label="Email Address" value={seller.email} />
                </CardContent>
            </Card>

            {/* Legal & Licensing - Usually read-only or requires verify so keeping read-only for now unless asked */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        Legal & Licensing
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoItem icon={FileText} label="GST / Reg Number" value={seller.businessRegistrationNumberOrGST} />
                    <InfoItem icon={FileText} label="FSSAI License" value={seller.fssaiLicenseNumber} />
                    <InfoItem icon={FileText} label="PAN Number" value={seller.panNumber} />
                </CardContent>
            </Card>

            {/* Operations */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-green-600" />
                        Operations
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {isEditing ? (
                            <>
                                <div className="p-4 bg-gray-50 rounded-lg space-y-2 border border-green-200">
                                    <label className="text-sm font-medium text-gray-700">Delivery Method</label>
                                    <select
                                        name="deliveryMethod"
                                        value={formData.deliveryMethod}
                                        onChange={handleInputChange}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        <option value="">Select Method</option>
                                        <option value="Self Delivery">Self Delivery</option>
                                        <option value="Third-party Logistics">Third-party Logistics</option>
                                    </select>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg space-y-2 border border-green-200">
                                    <label className="text-sm font-medium text-gray-700">Operating Hours</label>
                                    <div className="p-2 border rounded-md bg-gray-100 text-gray-500 text-sm">
                                        {formatHoursForDisplay(seller.operatingHours)}
                                        <span className="block text-xs mt-1 text-orange-600">(Manage via Store Overview)</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <InfoItem icon={Truck} label="Delivery Method" value={seller.deliveryMethod} />
                                <InfoItem icon={Clock} label="Operating Hours" value={formatHoursForDisplay(seller.operatingHours)} />
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Banking Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-green-600" />
                        Banking Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isEditing ? (
                        <>
                            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                                <label className="text-sm font-medium text-gray-700">Account Holder Name</label>
                                <input
                                    type="text"
                                    name="bankAccountHolderName"
                                    value={formData.bankAccountHolderName}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-md"
                                />
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                                <label className="text-sm font-medium text-gray-700">Account Number</label>
                                <input
                                    type="text"
                                    name="bankAccountNumber"
                                    value={formData.bankAccountNumber}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-md"
                                />
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                                <label className="text-sm font-medium text-gray-700">IFSC Code</label>
                                <input
                                    type="text"
                                    name="ifscCode"
                                    value={formData.ifscCode}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-md"
                                />
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                                <label className="text-sm font-medium text-gray-700">UPI ID</label>
                                <input
                                    type="text"
                                    name="upiId"
                                    value={formData.upiId}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded-md"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <InfoItem icon={User} label="Account Holder" value={seller.bankAccountHolderName} />
                            <InfoItem icon={CreditCard} label="Account Number" value={seller.bankAccountNumber} />
                            <InfoItem icon={FileText} label="IFSC Code" value={seller.ifscCode} />
                            <InfoItem icon={Smartphone} label="UPI ID" value={seller.upiId} />
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Product Categories */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tags className="h-5 w-5 text-green-600" />
                        Product Categories
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isEditing ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg border border-green-200">
                            {CATEGORY_OPTIONS.map((cat) => (
                                <label key={cat} className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.productCategories.includes(cat)}
                                        onChange={() => handleCategoryChange(cat)}
                                        className="rounded text-green-600 focus:ring-green-500 h-4 w-4"
                                    />
                                    <span className="text-sm text-gray-700">{cat}</span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <>
                            {seller.productCategories && seller.productCategories.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {seller.productCategories.map((cat, index) => (
                                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                            {cat}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No categories listed.</p>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Action Buttons */}
            {isEditing && (
                <div className="flex justify-end gap-3 sticky bottom-4">
                    <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default Profile;
