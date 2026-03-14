import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, MoreVertical, Edit2, Trash2, Eye, X, Mail, Phone, MapPin, Building, CreditCard, ShoppingBag, Clock, IndianRupee, Leaf } from 'lucide-react';
import toast from 'react-hot-toast';

const Sellers = () => {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSeller, setSelectedSeller] = useState(null);
    const [isModalLoading, setIsModalLoading] = useState(false);

    useEffect(() => {
        fetchSellers();
    }, []);

    const fetchSellers = async () => {
        try {
            const res = await fetch('http://localhost:5003/api/admin/sellers');
            const data = await res.json();
            setSellers(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching sellers:', error);
            setLoading(false);
            toast.error('Failed to load sellers');
        }
    };

    const fetchSellerDetails = async (sellerId) => {
        setIsModalLoading(true);
        try {
            // Using the userId from AdminSeller to fetch full details from Seller collection
            const res = await fetch(`http://localhost:5003/api/admin/sellers/${sellerId}`);
            const data = await res.json();
            if (res.ok) {
                setSelectedSeller(data);
            } else {
                toast.error(data.message || 'Failed to fetch seller details');
            }
        } catch (error) {
            console.error('Error fetching seller details:', error);
            toast.error('Error loading seller profile');
        } finally {
            setIsModalLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedSeller(null);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Seller Management</h1>
                    <p className="text-gray-500 mt-1">Manage and monitor platform sellers</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                        <Filter size={18} />
                        Filter
                    </button>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                        Add Seller
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search sellers by name or email..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 font-medium text-gray-600">Business Name</th>
                                <th className="p-4 font-medium text-gray-600">Contact Info</th>
                                <th className="p-4 font-medium text-gray-600">Joined Date</th>
                                <th className="p-4 font-medium text-gray-600">Status</th>
                                <th className="p-4 font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">Loading sellers...</td>
                                </tr>
                            ) : sellers.length > 0 ? (
                                sellers.map(seller => (
                                    <tr key={seller._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-semibold text-gray-900">
                                            <button 
                                                onClick={() => fetchSellerDetails(seller.userId)}
                                                className="text-blue-600 hover:text-blue-800 hover:underline text-left font-bold"
                                            >
                                                {seller.businessName}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm text-gray-900">{seller.contactEmail}</div>
                                            <div className="text-sm text-gray-500">{seller.contactPhone}</div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {new Date(seller.joinedAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${seller.status === 'Active' ? 'bg-green-100 text-green-700' :
                                                    seller.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {seller.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => fetchSellerDetails(seller.userId)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button className="p-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors"><Edit2 size={16} /></button>
                                                <button className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        <Users className="mx-auto mb-3 text-gray-400" size={32} />
                                        <p>No sellers registered yet.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Seller Details Modal */}
            {selectedSeller && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-green-50 to-white">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-xl">
                                    {selectedSeller.businessName?.[0] || selectedSeller.sellerName?.[0] || 'S'}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{selectedSeller.businessName || selectedSeller.sellerName}</h2>
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <Building size={14} /> {selectedSeller.businessType || 'General Seller'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={closeModal}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={24} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Grid Layout for Sections */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                
                                {/* Basic Information */}
                                <section className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Building size={16} className="text-green-600" /> Basic Information
                                    </h3>
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                        <div>
                                            <p className="text-xs text-gray-500">Business Name</p>
                                            <p className="font-semibold text-gray-900">{selectedSeller.businessName || selectedSeller.sellerName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Store Name</p>
                                            <p className="font-semibold text-gray-900">{selectedSeller.storeName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Registration / GST</p>
                                            <p className="font-semibold text-gray-900">{selectedSeller.businessRegistrationNumberOrGST || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">FSSAI License</p>
                                            <p className="font-semibold text-gray-900">{selectedSeller.fssaiLicenseNumber || 'N/A'}</p>
                                        </div>
                                    </div>
                                </section>

                                {/* Contact Details */}
                                <section className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Mail size={16} className="text-blue-600" /> Contact Details
                                    </h3>
                                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <Mail size={18} className="text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Email Address</p>
                                                <p className="font-medium text-gray-900">{selectedSeller.email || selectedSeller.contactEmail}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                <Phone size={18} className="text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Phone Number</p>
                                                <p className="font-medium text-gray-900">{selectedSeller.phoneNumber || selectedSeller.contactPhone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-white rounded-lg shadow-sm mt-1">
                                                <MapPin size={18} className="text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Store Address</p>
                                                <p className="font-medium text-gray-900 leading-relaxed">
                                                    {selectedSeller.storeAddress}, {selectedSeller.pinCode}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Banking Details */}
                                <section className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <CreditCard size={16} className="text-purple-600" /> Banking Details
                                    </h3>
                                    <div className="bg-purple-50 rounded-xl p-4 space-y-3 border border-purple-100">
                                        <div>
                                            <p className="text-xs text-purple-500">Account Holder</p>
                                            <p className="font-semibold text-gray-900 uppercase">{selectedSeller.bankAccountHolderName || 'N/A'}</p>
                                        </div>
                                        <div className="flex justify-between">
                                            <div>
                                                <p className="text-xs text-purple-500">Account Number</p>
                                                <p className="font-mono text-gray-900">{selectedSeller.bankAccountNumber || '••••••••••••'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-purple-500 text-right">IFSC Code</p>
                                                <p className="font-mono text-gray-900 text-right">{selectedSeller.ifscCode || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-purple-500">UPI ID</p>
                                            <p className="font-medium text-blue-600">{selectedSeller.upiId || 'N/A'}</p>
                                        </div>
                                    </div>
                                </section>

                                {/* Operations & Categories */}
                                <div className="space-y-8">
                                    <section className="space-y-4">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <ShoppingBag size={16} className="text-orange-600" /> Product Categories
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedSeller.productCategories?.length > 0 ? (
                                                selectedSeller.productCategories.map(cat => (
                                                    <span key={cat} className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full border border-orange-200">
                                                        {cat}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-500 italic">No categories assigned</span>
                                            )}
                                        </div>
                                    </section>

                                    <section className="space-y-4">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Clock size={16} className="text-yellow-600" /> Operations
                                        </h3>
                                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Delivery Method</span>
                                                <span className="text-sm font-bold bg-white px-2 py-1 rounded shadow-sm">
                                                    {selectedSeller.deliveryMethod || 'Default'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Operating Hours</p>
                                                <p className="text-sm text-gray-800 font-medium">
                                                    {typeof selectedSeller.operatingHours === 'string' 
                                                        ? selectedSeller.operatingHours 
                                                        : 'Mon - Sun | 09:00 AM - 09:00 PM'}
                                                </p>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            </div>

                            {/* Revenue and Local Produce - Full Width */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                <section className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <IndianRupee size={16} className="text-emerald-600" /> Revenue Details
                                    </h3>
                                    <div className="bg-emerald-600 rounded-xl p-6 text-white shadow-lg overflow-hidden relative">
                                        <div className="relative z-10">
                                            <p className="text-emerald-100 text-sm">Main Wallet Balance</p>
                                            <h4 className="text-3xl font-bold mt-1">₹{selectedSeller.walletBalance?.toLocaleString() || '0.00'}</h4>
                                            
                                            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-emerald-500 pt-4">
                                                <div>
                                                    <p className="text-xs text-emerald-100">Total Earnings</p>
                                                    <p className="text-lg font-bold">₹{(selectedSeller.walletBalance * 1.2 || 0).toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-emerald-100">Platform Profit (30%)</p>
                                                    <p className="text-lg font-bold">₹{(selectedSeller.walletBalance * 0.3 || 0).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Leaf size={16} className="text-green-600" /> Source Local Produce
                                    </h3>
                                    <div className="bg-white border-2 border-dashed border-green-200 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-3">
                                            <Leaf size={24} />
                                        </div>
                                        <h4 className="font-bold text-gray-900">Direct Sourcing Activity</h4>
                                        <p className="text-sm text-gray-500 mt-1">Active participant in local grower procurement (C2B)</p>
                                        <div className="mt-4 flex gap-4 w-full">
                                            <div className="flex-1 bg-green-50 rounded-lg p-2">
                                                <p className="text-xs text-green-700 font-bold uppercase">Active Claims</p>
                                                <p className="text-xl font-bold text-green-900">12</p>
                                            </div>
                                            <div className="flex-1 bg-blue-50 rounded-lg p-2">
                                                <p className="text-xs text-blue-700 font-bold uppercase">Purchased</p>
                                                <p className="text-xl font-bold text-blue-900">450kg</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                            <button 
                                onClick={closeModal}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                            >
                                Close
                            </button>
                            <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                                Download Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sellers;

