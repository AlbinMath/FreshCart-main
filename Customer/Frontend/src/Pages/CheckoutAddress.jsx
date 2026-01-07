import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../navbar/Navbar';
import apiService from '../services/apiService';

export default function CheckoutAddress() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        fetchAddresses();
    }, [currentUser, navigate]);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
            const response = await apiService.get(`/users/${currentUser.uid}`);
            if (response.success && response.user) {
                const userAddresses = response.user.addresses || [];
                setAddresses(userAddresses);

                // Select default address or the first one found
                const defaultAddr = userAddresses.find(addr => addr.isDefault);
                if (defaultAddr) {
                    setSelectedAddressId(defaultAddr._id);
                } else if (userAddresses.length > 0) {
                    setSelectedAddressId(userAddresses[0]._id);
                }
            }
        } catch (err) {
            console.error("Failed to fetch addresses", err);
            setError("Failed to load addresses.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddressSelect = (id) => {
        setSelectedAddressId(id);
    };

    const handleContinue = () => {
        if (!selectedAddressId) {
            alert("Please select an address to continue.");
            return;
        }
        // Navigate to payment with selected address
        navigate('/checkout/payment', { state: { addressId: selectedAddressId } });
    };

    const handleDelete = async (e, addressId) => {
        e.stopPropagation(); // Prevent card selection
        if (!window.confirm("Are you sure you want to delete this address?")) return;

        try {
            const response = await apiService.delete(`/users/address/${addressId}?uid=${currentUser.uid}`);
            if (response.success) {
                // Remove from state
                setAddresses(prev => prev.filter(addr => addr._id !== addressId));
                // Deselect if deleted
                if (selectedAddressId === addressId) setSelectedAddressId(null);
            } else {
                alert(response.message || "Failed to delete address");
            }
        } catch (err) {
            console.error("Delete failed", err);
            alert("Failed to delete address");
        }
    };

    const handleSetDefault = async (e, addressId) => {
        e.stopPropagation();
        try {
            const response = await apiService.put('/users/address/set-default', {
                uid: currentUser.uid,
                addressId
            });
            if (response.success) {
                // Update local state
                setAddresses(prev => prev.map(addr => ({
                    ...addr,
                    isDefault: addr._id === addressId
                })));
                // Select the new default
                setSelectedAddressId(addressId);
            }
        } catch (err) {
            console.error("Failed to set default", err);
            alert("Failed to update default address");
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="flex-grow flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-gray-800">Select Delivery Address</h1>
                        <Link to="/add-address" state={{ from: '/checkout/address' }} className="text-green-600 hover:text-green-700 font-medium">+ Add New Address</Link>
                    </div>

                    {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

                    {addresses.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <p className="text-gray-500 mb-4">You have no saved addresses.</p>
                            <Link to="/add-address" state={{ from: '/checkout/address' }} className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition">Add Address</Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {addresses.map((addr) => (
                                <div
                                    key={addr._id}
                                    className={`relative bg-white border rounded-lg p-6 cursor-pointer transition ${selectedAddressId === addr._id ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200 hover:border-green-300'}`}
                                    onClick={() => handleAddressSelect(addr._id)}
                                >
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0 mt-1">
                                            <input
                                                type="radio"
                                                name="address"
                                                className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300"
                                                checked={selectedAddressId === addr._id}
                                                readOnly
                                            />
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-gray-900">
                                                    <span className="font-bold">{addr.name}</span><br />
                                                    {addr.houseNumber} {addr.street}, {addr.city}
                                                </p>
                                                {addr.isDefault && (
                                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Default</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">{addr.state}, {addr.zipCode}</p>
                                            <p className="text-sm text-gray-500">{addr.country}</p>
                                        </div>
                                        {!addr.isDefault && (
                                            <div className="flex flex-col items-end gap-2">
                                                <button
                                                    onClick={(e) => handleSetDefault(e, addr._id)}
                                                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded border border-gray-300 transition"
                                                >
                                                    Set Default
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(e, addr._id)}
                                                    className="text-red-500 hover:text-red-700 p-2"
                                                    title="Delete Address"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleContinue}
                            disabled={!selectedAddressId}
                            className="bg-green-600 text-white py-3 px-8 rounded-lg font-bold text-lg hover:bg-green-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
