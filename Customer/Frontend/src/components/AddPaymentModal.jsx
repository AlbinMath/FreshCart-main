import React, { useState } from 'react';
import axios from 'axios';

const AddPaymentModal = ({ isOpen, onClose, uid, onPaymentAdded }) => {
    const [type, setType] = useState('UPI');
    const [upiId, setUpiId] = useState('');
    const [bankDetails, setBankDetails] = useState({
        accountNumber: '',
        bankName: '',
        ifscCode: ''
    });
    const [loading, setLoading] = useState(false);
    const [isDefault, setIsDefault] = useState(false);
    const [errors, setErrors] = useState({});

    if (!isOpen) return null;

    const validate = () => {
        const newErrors = {};
        if (type === 'UPI') {
            const upiRegex = /^[\w.-]+@[\w.-]+$/;
            if (!upiId) newErrors.upiId = 'UPI ID is required';
            else if (!upiRegex.test(upiId)) newErrors.upiId = 'Invalid UPI ID format (e.g., user@bank)';
        } else {
            if (!bankDetails.accountNumber) newErrors.accountNumber = 'Account number is required';
            else if (!/^\d{9,18}$/.test(bankDetails.accountNumber)) newErrors.accountNumber = 'Account number must be 9-18 digits';
            
            if (!bankDetails.bankName) newErrors.bankName = 'Bank name is required';
            
            const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
            if (!bankDetails.ifscCode) newErrors.ifscCode = 'IFSC code is required';
            else if (!ifscRegex.test(bankDetails.ifscCode.toUpperCase())) newErrors.ifscCode = 'Invalid IFSC format (e.g., ABCD0123456)';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        
        setLoading(true);

        const details = type === 'UPI' ? { upiId } : {
            ...bankDetails,
            ifscCode: bankDetails.ifscCode.toUpperCase()
        };

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/payment-detail`, {
                uid,
                type,
                details,
                isDefault
            });

            if (response.data.success) {
                alert('Payment method added successfully');
                onPaymentAdded();
                onClose();
                // Reset form
                setUpiId('');
                setBankDetails({ accountNumber: '', bankName: '', ifscCode: '' });
                setErrors({});
            }
        } catch (error) {
            console.error('Error adding payment method:', error);
            alert('Failed to add payment method');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
                <div className="bg-green-600 p-6 flex justify-between items-center text-white">
                    <h3 className="text-xl font-bold">Add Payment Method</h3>
                    <button onClick={onClose} className="hover:text-green-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="flex gap-4 p-1 bg-gray-100 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setType('UPI')}
                            className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${type === 'UPI' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            UPI ID
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('BANK')}
                            className={`flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all ${type === 'BANK' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Bank Account
                        </button>
                    </div>

                    {type === 'UPI' ? (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">UPI ID</label>
                            <input
                                type="text"
                                placeholder="example@upi"
                                value={upiId}
                                onChange={(e) => {
                                    setUpiId(e.target.value);
                                    if (errors.upiId) setErrors({ ...errors, upiId: null });
                                }}
                                className={`w-full px-4 py-3 bg-gray-50 border ${errors.upiId ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all`}
                            />
                            {errors.upiId && <p className="text-red-500 text-xs mt-1 font-medium">{errors.upiId}</p>}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account Number</label>
                                <input
                                    type="text"
                                    placeholder="Enter your account number"
                                    value={bankDetails.accountNumber}
                                    onChange={(e) => {
                                        setBankDetails({ ...bankDetails, accountNumber: e.target.value });
                                        if (errors.accountNumber) setErrors({ ...errors, accountNumber: null });
                                    }}
                                    className={`w-full px-4 py-3 bg-gray-50 border ${errors.accountNumber ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all`}
                                />
                                {errors.accountNumber && <p className="text-red-500 text-xs mt-1 font-medium">{errors.accountNumber}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bank Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. HDFC Bank"
                                    value={bankDetails.bankName}
                                    onChange={(e) => {
                                        setBankDetails({ ...bankDetails, bankName: e.target.value });
                                        if (errors.bankName) setErrors({ ...errors, bankName: null });
                                    }}
                                    className={`w-full px-4 py-3 bg-gray-50 border ${errors.bankName ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all`}
                                />
                                {errors.bankName && <p className="text-red-500 text-xs mt-1 font-medium">{errors.bankName}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">IFSC Code</label>
                                <input
                                    type="text"
                                    placeholder="HDFC0001234"
                                    value={bankDetails.ifscCode}
                                    onChange={(e) => {
                                        setBankDetails({ ...bankDetails, ifscCode: e.target.value });
                                        if (errors.ifscCode) setErrors({ ...errors, ifscCode: null });
                                    }}
                                    className={`w-full px-4 py-3 bg-gray-50 border ${errors.ifscCode ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all`}
                                />
                                {errors.ifscCode && <p className="text-red-500 text-xs mt-1 font-medium">{errors.ifscCode}</p>}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 py-2">
                        <input
                            type="checkbox"
                            id="isDefault"
                            checked={isDefault}
                            onChange={(e) => setIsDefault(e.target.checked)}
                            className="w-5 h-5 rounded text-green-600 focus:ring-green-500 cursor-pointer"
                        />
                        <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Set as primary payment method
                        </label>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-lg shadow-green-200 transition-all ${loading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            {loading ? 'Adding...' : 'Save Method'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPaymentModal;
