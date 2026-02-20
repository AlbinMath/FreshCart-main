import React, { useState, useEffect } from 'react';
import { X, Package, MapPin, IndianRupee, KeyRound, CheckCircle, RefreshCw, Calculator, AlertCircle } from 'lucide-react';
import axios from 'axios';

const DeliveryCompletionDialog = ({ isOpen, onClose, order, onCompleteSuccess }) => {
    if (!isOpen || !order) return null;

    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Cash Collection State
    const [collectedCash, setCollectedCash] = useState('');
    const [changeAmount, setChangeAmount] = useState(null);
    const [cashError, setCashError] = useState(null);

    // Determine if COD
    const isCod = order.paymentMethod &&
        ['cash on delivery', 'cod', 'cash'].some(val => order.paymentMethod.toLowerCase().includes(val));

    // Reset state when dialog opens/closes or order changes
    useEffect(() => {
        setOtp('');
        setGeneratedOtp(null);
        setError(null);
        setCollectedCash('');
        setChangeAmount(null);
        setCashError(null);
    }, [isOpen, order]);

    // Real-time calculation
    useEffect(() => {
        if (!collectedCash) {
            setChangeAmount(null);
            return;
        }
        const collected = parseFloat(collectedCash);
        const total = parseFloat(order.totalAmount || 0);

        if (!isNaN(collected)) {
            setChangeAmount(collected - total);
        } else {
            setChangeAmount(null);
        }
    }, [collectedCash, order.totalAmount]);

    const handleGenerateOtp = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Generate OTP via Python Service
            const otpResponse = await axios.get('http://localhost:8000/api/otp');
            const newOtp = otpResponse.data.otp;
            setGeneratedOtp(newOtp);

            // 2. Store OTP in Backend (Order Document)
            await axios.post('http://localhost:5007/api/delivery-agent/active-otp', {
                orderId: order._id,
                otp: newOtp
            });

        } catch (err) {
            console.error("Error generating OTP:", err);
            setError("Failed to generate OTP. Ensure OTP service is running.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndComplete = async () => {
        // Validation for COD
        if (isCod) {
            if (!collectedCash) {
                setCashError("Please enter the collected amount first.");
                return;
            }
            if (parseFloat(collectedCash) < parseFloat(order.totalAmount)) {
                setCashError(`Amount matches total? Balance due: ₹${Math.abs(changeAmount)}`);
                // Allow proceeding only if explicitly intended? For now, block if underpaid.
                // Or maybe just warn. Let's block for safety unless user override logic exists.
                return;
            }
        }

        if (!otp) {
            setError("Please enter the customer OTP.");
            return;
        }

        setLoading(true);
        setError(null);
        setCashError(null); // Clear cash errors if any

        try {
            await axios.post('http://localhost:5007/api/delivery-agent/verify-otp', {
                orderId: order._id,
                enteredOtp: otp,
                // Optional: Send collected cash info if backend needs it record keeping
                collectedCash: isCod ? parseFloat(collectedCash) : 0
            });

            onCompleteSuccess(); // Refresh parent list
            onClose(); // Close dialog

        } catch (err) {
            console.error("Error verifying OTP:", err);
            setError(err.response?.data?.message || "Invalid OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <CheckCircle className="text-green-600" size={24} />
                        Complete Order
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Order Summary */}
                    <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-gray-800">Order #{order._id.substring(0, 8)}...</h3>
                                <p className="text-xs text-gray-500">Payment: <span className="font-bold uppercase text-gray-700">{order.paymentMethod || 'Prepaid'}</span></p>
                            </div>
                            <span className="font-bold text-xl text-green-700">₹{order.totalAmount}</span>
                        </div>

                        {isCod && (
                            <div className="mt-2 p-2 bg-orange-100 border border-orange-200 rounded-lg text-orange-800 text-sm font-semibold flex items-center justify-center gap-2">
                                <AlertCircle size={16} />
                                Cash Collection Required
                            </div>
                        )}
                    </div>

                    {/* Step 1: OTP Generation */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <KeyRound className="text-blue-600" size={20} />
                                {generatedOtp ? "OTP Generated" : "Step 1: Generate OTP"}
                            </h3>
                        </div>

                        <button
                            onClick={handleGenerateOtp}
                            disabled={loading}
                            className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors
                                ${generatedOtp
                                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                                }`}
                        >
                            {generatedOtp ? <RefreshCw size={18} /> : <KeyRound size={18} />}
                            {generatedOtp ? `OTP Active` : "Generate Customer OTP"}
                        </button>
                        {generatedOtp && <p className="text-xs text-center text-gray-400">Share this OTP with the customer if they haven't received it.</p>}
                    </div>

                    {/* Step 2: Cash Collection (CONDITIONAL) */}
                    {isCod && (
                        <div className={`space-y-4 border-t border-gray-100 pt-6 transition-opacity duration-300 ${!generatedOtp ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                <IndianRupee className="text-green-600" size={20} />
                                Step 2: Cash Collection
                            </h3>

                            <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Enter Collected Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                        <input
                                            type="number"
                                            value={collectedCash}
                                            onChange={(e) => {
                                                setCollectedCash(e.target.value);
                                                setCashError(null);
                                            }}
                                            placeholder="0.00"
                                            className="w-full pl-8 p-3 bg-white border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-bold text-gray-800"
                                        />
                                    </div>
                                    {cashError && <p className="text-red-500 text-xs mt-1 font-medium">{cashError}</p>}
                                </div>

                                {/* Calculation Result */}
                                {collectedCash && changeAmount !== null && (
                                    <div className={`p-3 rounded-lg flex justify-between items-center text-sm font-bold
                                        ${changeAmount >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                                    `}>
                                        <span>{changeAmount >= 0 ? "Return to Customer:" : "Balance Due:"}</span>
                                        <span className="text-lg">₹{Math.abs(changeAmount).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Verify & Complete */}
                    <div className={`space-y-4 border-t border-gray-100 pt-6 transition-opacity duration-300 ${!generatedOtp ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                            <CheckCircle className="text-purple-600" size={20} />
                            Step 3: Verify & Complete
                        </h3>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Enter Customer OTP</label>
                            <input
                                type="text"
                                maxLength="6"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="• • • • • •"
                                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-2xl tracking-[0.5em] font-mono"
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</p>}

                        <button
                            onClick={handleVerifyAndComplete}
                            disabled={loading || otp.length < 4}
                            className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50 disabled:shadow-none translate-y-0 active:translate-y-1"
                        >
                            {loading ? "Verifying..." : "Verify & Complete Order"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DeliveryCompletionDialog;
