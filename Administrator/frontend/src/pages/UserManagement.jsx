import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Truck, Store, User } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

const UserManagement = () => {
    const [activeTab, setActiveTab] = useState('DeliveryAgent'); // DeliveryAgent, Seller, Customer
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const tabs = [
        { id: 'DeliveryAgent', label: 'Delivery Agents', icon: Truck },
        { id: 'Seller', label: 'Sellers', icon: Store },
        { id: 'Customer', label: 'Customers', icon: User },
    ];

    useEffect(() => {
        fetchUsers();
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5003';
            const response = await axios.get(`${apiUrl}/api/users/${activeTab}`);
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                <div className="bg-white rounded-lg border p-1 flex">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === tab.id
                                ? 'bg-green-500 text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <tab.icon size={18} />
                            <span className="font-medium">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    {activeTab === 'DeliveryAgent' && (
                                        <>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle No</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </>
                                    )}
                                    {activeTab === 'Seller' && (
                                        <>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        </>
                                    )}
                                    {activeTab === 'Customer' && (
                                        <>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                        </>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.length > 0 ? (
                                    users.map((user) => (
                                        <tr key={user._id} className="hover:bg-gray-50">
                                            {activeTab === 'DeliveryAgent' && (
                                                <>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="font-medium text-gray-900">{user.fullName}</div>
                                                        <div className="text-xs text-gray-500">{user.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.contactNumber}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.vehicleRegistrationNumber}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                            {user.status || 'Pending'}
                                                        </span>
                                                    </td>
                                                </>
                                            )}
                                            {activeTab === 'Seller' && (
                                                <>
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{user.storeName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.sellerName}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{user.phoneNumber}</div>
                                                        <div className="text-xs text-gray-500">{user.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                            {user.status || 'Pending'}
                                                        </span>
                                                    </td>
                                                </>
                                            )}
                                            {activeTab === 'Customer' && (
                                                <>
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{user.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phoneNumber}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {user.addressDetails ? (
                                                            <>
                                                                <div>{user.addressDetails.street}, {user.addressDetails.city}</div>
                                                                <div className="text-xs text-gray-400">{user.addressDetails.state} - {user.addressDetails.zipCode}</div>
                                                            </>
                                                        ) : (
                                                            <span className="text-gray-400 italic">No address</span>
                                                        )}
                                                    </td>
                                                </>
                                            )}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <button
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="text-green-600 hover:text-green-900 font-medium"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                            No {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>
                            {activeTab === 'DeliveryAgent' ? 'Delivery Agent Details' :
                                activeTab === 'Seller' ? 'Seller Details' : 'Customer Details'}
                        </DialogTitle>
                        <DialogDescription>
                            View detailed information about the selected {activeTab === 'DeliveryAgent' ? 'Delivery Agent' : activeTab === 'Seller' ? 'Seller' : 'Customer'}.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedUser && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            {/* Profile Section - Spans full width on mobile, left col on desktop */}
                            <div className="md:col-span-2 flex items-center gap-4 bg-gray-50 p-4 rounded-lg border">
                                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-2xl border-2 border-green-200">
                                    {(selectedUser.name || selectedUser.fullName || selectedUser.sellerName || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {selectedUser.name || selectedUser.fullName || selectedUser.sellerName}
                                    </h3>
                                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                                    <Badge className={`mt-2 ${(selectedUser.status === 'active' || selectedUser.isVerified)
                                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                        : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                                        }`}>
                                        {selectedUser.status || (selectedUser.isVerified ? 'Verified' : 'Pending')}
                                    </Badge>
                                </div>
                            </div>

                            {/* Common Fields */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
                                <p className="text-gray-900 font-medium">{selectedUser.phone || selectedUser.phoneNumber || selectedUser.contactNumber || 'N/A'}</p>
                            </div>

                            {/* Delivery Agent Specific */}
                            {activeTab === 'DeliveryAgent' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date of Birth</label>
                                        <p className="text-gray-900">{selectedUser.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Residential Address</label>
                                        <p className="text-gray-900">{selectedUser.residentialAddress || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle Type</label>
                                        <p className="text-gray-900">{selectedUser.vehicleType || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle Registration</label>
                                        <p className="text-gray-900">{selectedUser.vehicleRegistrationNumber || 'N/A'}</p>
                                    </div>

                                    <div className="md:col-span-2 mt-4">
                                        <h4 className="text-sm font-bold text-gray-900 border-b pb-2 mb-3">Bank Details</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500">Account Holder</label>
                                                <p className="font-medium">{selectedUser.accountHolderName || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500">Account Number</label>
                                                <p className="font-medium">{selectedUser.bankAccountNumber || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500">IFSC Code</label>
                                                <p className="font-medium">{selectedUser.ifscCode || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500">UPI ID</label>
                                                <p className="font-medium">{selectedUser.upiId || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Seller Specific */}
                            {activeTab === 'Seller' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Store Name</label>
                                        <p className="text-gray-900 font-medium">{selectedUser.storeName || 'N/A'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Business Type</label>
                                        <p className="text-gray-900">{selectedUser.businessType || 'N/A'}</p>
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Store Address</label>
                                        <p className="text-gray-900">{selectedUser.storeAddress || 'N/A'} - {selectedUser.pinCode}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">GST / Reg No</label>
                                        <div className="flex items-center gap-2">
                                            <span>{selectedUser.businessRegistrationNumberOrGST || 'N/A'}</span>
                                            <Badge variant="outline" className={selectedUser.gstDocumentStatus === 'verified' ? 'text-green-600 border-green-200' : 'text-yellow-600 border-yellow-200'}>
                                                {selectedUser.gstDocumentStatus}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">FSSAI License</label>
                                        <div className="flex items-center gap-2">
                                            <span>{selectedUser.fssaiLicenseNumber || 'N/A'}</span>
                                            <Badge variant="outline" className={selectedUser.fssaiLicenseStatus === 'verified' ? 'text-green-600 border-green-200' : 'text-yellow-600 border-yellow-200'}>
                                                {selectedUser.fssaiLicenseStatus}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 mt-4">
                                        <h4 className="text-sm font-bold text-gray-900 border-b pb-2 mb-3">Operating & Delivery</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500">Operating Hours</label>
                                                <p className="font-medium">{selectedUser.operatingHours || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500">Delivery Method</label>
                                                <p className="font-medium">{selectedUser.deliveryMethod || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 mt-4">
                                        <h4 className="text-sm font-bold text-gray-900 border-b pb-2 mb-3">Financial Information</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500">Account Holder</label>
                                                <p className="font-medium">{selectedUser.bankAccountHolderName || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500">Account Number</label>
                                                <p className="font-medium">{selectedUser.bankAccountNumber || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500">IFSC Code</label>
                                                <p className="font-medium">{selectedUser.ifscCode || 'N/A'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-500">PAN Number</label>
                                                <p className="font-medium">{selectedUser.panNumber || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Customer Specific */}
                            {activeTab === 'Customer' && selectedUser.addressDetails && (
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</label>
                                    <div className="bg-gray-50 p-3 rounded border text-sm">
                                        <p>{selectedUser.addressDetails.street}</p>
                                        <p>{selectedUser.addressDetails.city}, {selectedUser.addressDetails.state}</p>
                                        <p>{selectedUser.addressDetails.country} - {selectedUser.addressDetails.zipCode}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UserManagement;
