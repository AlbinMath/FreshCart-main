import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AddPaymentModal from '../components/AddPaymentModal';

export default function Profile() {
    const { currentUser, verifyEmail } = useAuth();
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState([]);
    const [revealedDetails, setRevealedDetails] = useState({}); // { id: decryptedDetails }
    const [loadingPayment, setLoadingPayment] = useState(false);

    useEffect(() => {
        if (currentUser) {
            fetchUserWithDetails();
        }
    }, [currentUser]);

    const fetchUserWithDetails = async () => {
        try {
            setLoadingPayment(true);
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/${currentUser.uid}`);
            if (response.data.success) {
                setPaymentDetails(response.data.user.paymentDetails || []);
            }
        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoadingPayment(false);
        }
    };

    const handleRevealPayment = async (id) => {
        if (revealedDetails[id]) {
            const newRevealed = { ...revealedDetails };
            delete newRevealed[id];
            setRevealedDetails(newRevealed);
            return;
        }

        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/payment-detail/reveal/${id}?uid=${currentUser.uid}`);
            if (response.data.success) {
                setRevealedDetails({ ...revealedDetails, [id]: response.data.details });
            }
        } catch (error) {
            alert('Failed to reveal details. Please ensure you are authorized.');
        }
    };

    const handleDeletePayment = async (id) => {
        if (!window.confirm('Are you sure you want to delete this payment method?')) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/users/payment-detail/${id}?uid=${currentUser.uid}`);
            fetchUserWithDetails();
        } catch (error) {
            alert('Error deleting payment method');
        }
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">

                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900">Please info Log in to view profile</h2>
                        <Link to="/login" className="mt-4 inline-block text-green-600 hover:text-green-500">Go to Login</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">

            <div className="flex-grow container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="bg-green-600 py-6 px-6 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="bg-white p-2 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{currentUser.name || currentUser.displayName}</h2>
                                <p className="text-green-100">{currentUser.email}</p>
                            </div>
                        </div>
                        <Link to="/" className="text-white hover:text-green-100 font-medium">Home</Link>
                    </div>
                    <div className="p-6 space-y-6">
                        {!currentUser.emailVerified && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-yellow-700">
                                            Your email is not verified.
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await verifyEmail(currentUser);
                                                        alert('Verification email sent!');
                                                    } catch (error) {
                                                        alert('Error sending verification email: ' + error.message);
                                                    }
                                                }}
                                                className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-2"
                                            >
                                                Resend Verification Email
                                            </button>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Account Details</h3>
                            <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{currentUser.name || currentUser.displayName || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{currentUser.email}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{currentUser.phoneNumber || 'N/A'}</dd>
                                </div>
                                <div className="sm:col-span-2 relative mt-2 border border-gray-100 rounded-xl p-4 bg-gradient-to-br from-white to-gray-50 overflow-hidden">
                                    <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Membership Status</dt>
                                    <dd className="mt-1">
                                        {currentUser.activePremiumPlan ? (
                                            <div className="flex items-center gap-4">
                                                <div className="bg-yellow-50 p-3 rounded-full flex-shrink-0 text-yellow-600 border border-yellow-100">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" /></svg>
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                        {currentUser.activePremiumPlan.planName} Plan
                                                        <span className="bg-green-100 text-green-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm tracking-wider">Active</span>
                                                    </h4>
                                                    <p className="text-sm text-gray-500 mt-0.5">
                                                        Valid until {new Date(currentUser.activePremiumPlan.expiryDate).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-gray-100 p-2.5 rounded-full flex-shrink-0 text-gray-500">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">Basic Plan</p>
                                                        <p className="text-sm text-gray-500">Standard delivery rates apply.</p>
                                                    </div>
                                                </div>
                                                <Link to="/premium-plans" className="text-sm font-bold text-yellow-600 hover:text-yellow-700 bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200 transition-colors">
                                                    Upgrade
                                                </Link>
                                            </div>
                                        )}
                                    </dd>

                                    {/* Decorative background element for premium users */}
                                    {currentUser.activePremiumPlan && (
                                        <div className="absolute -right-6 -bottom-6 opacity-[0.03] pointer-events-none">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" /></svg>
                                        </div>
                                    )}
                                </div>
                            </dl>
                            <div className="mt-6 border-t pt-4">
                                <Link to="/change-password" className="text-green-600 hover:text-green-500 font-medium text-sm flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                    Change Password
                                </Link>
                                <Link to="/report-issue" className="text-red-500 hover:text-red-600 font-medium text-sm flex items-center mt-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Report an Issue
                                </Link>
                            </div>
                        </div>

                        {/* Premium Plan History Section */}
                        {currentUser.premiumPlansHistory && currentUser.premiumPlansHistory.length > 0 && (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                    Premium Purchase History
                                </h3>
                                <div className="mt-4 space-y-3">
                                    {currentUser.premiumPlansHistory.map((plan, idx) => (
                                        <div key={idx} className="bg-white border text-sm border-gray-100 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <p className="font-bold text-gray-900">{plan.planName} Plan</p>
                                                <p className="text-gray-500 mt-1">
                                                    Purchased: {new Date(plan.activationDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex flex-col sm:items-end">
                                                <p className="font-medium text-gray-900">₹{plan.grandTotal}</p>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 mt-1 rounded-sm tracking-wider ${plan.status === 'active' && new Date(plan.expiryDate) > new Date()
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {plan.status === 'active' && new Date(plan.expiryDate) > new Date() ? 'Active' : 'Expired'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <h3 className="text-lg font-medium text-gray-900">Default Address</h3>
                                <Link to="/add-address" className="text-sm text-green-600 hover:text-green-500 font-medium">
                                    + Add Address
                                </Link>
                            </div>
                            <div className="mt-4">
                                {currentUser.addresses && currentUser.addresses.find(addr => addr.isDefault) ? (
                                    (() => {
                                        const defaultAddr = currentUser.addresses.find(addr => addr.isDefault);
                                        return (
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <p className="font-medium text-gray-900">{currentUser.name || currentUser.displayName}</p>
                                                <p className="text-gray-600">{defaultAddr.street}</p>
                                                <p className="text-gray-600">{defaultAddr.city}, {defaultAddr.state} {defaultAddr.zipCode}</p>
                                                <p className="text-gray-600">{defaultAddr.country}</p>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                                        <p className="text-gray-500 text-sm">No default address selected.</p>
                                        <Link to="/add-address" className="mt-2 inline-block text-green-600 hover:text-green-500 text-sm font-medium">
                                            Add a new address
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Payment Requests Section */}
                        <div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Payment Requests
                                </h3>
                                <button 
                                    onClick={() => setIsPaymentModalOpen(true)}
                                    className="text-sm text-green-600 hover:text-green-500 font-medium"
                                >
                                    + Add Method
                                </button>
                            </div>
                            
                            <div className="mt-4 space-y-3">
                                {loadingPayment ? (
                                    <p className="text-sm text-gray-500">Loading payment methods...</p>
                                ) : paymentDetails.length > 0 ? (
                                    paymentDetails.map((pd) => (
                                        <div key={pd._id} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm text-green-600">
                                                        {pd.type === 'UPI' ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20" /><path d="m17 5-5-3-5 3" /><path d="m17 19-5 3-5-3" /><circle cx="12" cy="12" r="3" /></svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="10" width="18" height="12" rx="2" /><path d="M7 10V7a5 5 0 0 1 10 0v3" /></svg>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-gray-900 text-sm">{pd.type === 'UPI' ? 'UPI ID' : 'Bank Account'}</p>
                                                            {pd.isDefault && (
                                                                <span className="bg-green-100 text-green-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded-sm tracking-wider">Primary</span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-gray-600 space-y-0.5 mt-1">
                                                            {pd.type === 'UPI' ? (
                                                                <p className="font-mono">
                                                                    {revealedDetails[pd._id] ? revealedDetails[pd._id].upiId : pd.details.upiId}
                                                                </p>
                                                            ) : (
                                                                <>
                                                                    <p className="font-medium text-gray-800">
                                                                        {revealedDetails[pd._id] ? revealedDetails[pd._id].bankName : pd.details.bankName}
                                                                    </p>
                                                                    <p className="font-mono">
                                                                        A/C: {revealedDetails[pd._id] ? revealedDetails[pd._id].accountNumber : pd.details.accountNumber}
                                                                    </p>
                                                                    <p className="text-xs uppercase tracking-tight text-gray-500">
                                                                        IFSC: {revealedDetails[pd._id] ? revealedDetails[pd._id].ifscCode : pd.details.ifscCode}
                                                                    </p>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleRevealPayment(pd._id)}
                                                        className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
                                                        title={revealedDetails[pd._id] ? "Hide" : "Show"}
                                                    >
                                                        {revealedDetails[pd._id] ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                                            </svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeletePayment(pd._id)}
                                                        className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-gray-400"
                                                        title="Delete"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                                        <p className="text-gray-500 text-sm">No payment methods added.</p>
                                        <button 
                                            onClick={() => setIsPaymentModalOpen(true)}
                                            className="mt-2 text-green-600 hover:text-green-500 text-sm font-medium"
                                        >
                                            Add your first method
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <AddPaymentModal 
                            isOpen={isPaymentModalOpen} 
                            onClose={() => setIsPaymentModalOpen(false)} 
                            uid={currentUser.uid}
                            onPaymentAdded={fetchUserWithDetails}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
