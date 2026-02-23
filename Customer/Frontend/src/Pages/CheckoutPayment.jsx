import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import { cartService } from '../services/cartService';
import DeliveryEstimate from '../components/DeliveryEstimate';

export default function CheckoutPayment() {
    const { currentUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [cartItems, setCartItems] = useState([]);
    const [summary, setSummary] = useState({ subtotal: 0, tax: 0, total: 0 });
    const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' or 'cod'

    // Address passed from previous step
    const { addressId } = location.state || {};
    const [selectedAddress, setSelectedAddress] = useState(null);

    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        if (!addressId) {
            navigate('/checkout/address');
            return;
        }

        loadData();
    }, [currentUser, addressId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const cartRes = await cartService.getCart(currentUser.uid);
            let taxDetails = null;
            let subtotal = 0;
            let deliveryFee = 50;
            let platformFee = 5; // Reduced platform fee

            if (cartRes.success && cartRes.cart) {
                const items = cartRes.cart.items || [];
                setCartItems(items);
                subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

                // Dynamic Delivery Fee Logic
                if (subtotal > 1000) {
                    deliveryFee = 0;
                } else if (subtotal >= 600) {
                    deliveryFee = 10;
                } else {
                    deliveryFee = 50;
                }

                // Call Tax Service
                try {
                    const taxRes = await fetch('http://localhost:5005/api/v1/tax/calculate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            items: items.map(i => ({ ...i, category: 'basic' })), // Defaulting to basic (5%) as requested
                            deliveryFee,
                            platformFee
                        })
                    });
                    const taxData = await taxRes.json();

                    if (taxData.success) {
                        taxDetails = taxData.data;
                        // Use values from tax service (which includes 18% delivery tax etc)
                        setSummary({
                            subtotal: taxDetails.totals.subtotal,
                            tax: taxDetails.totals.totalTax,
                            total: taxDetails.totals.grandTotal,
                            details: taxDetails
                        });
                    } else {
                        throw new Error("Tax calculation failed");
                    }
                } catch (taxError) {
                    console.error("Tax service error:", taxError);
                    // Fallback to basic calculation if service fails
                    const tax = subtotal * 0.05;
                    setSummary({ subtotal, tax, total: subtotal + tax + deliveryFee + platformFee });
                }
            }

            const userRes = await apiService.get(`/users/${currentUser.uid}`);
            if (userRes.success && userRes.user) {
                const addr = userRes.user.addresses.find(a => a._id === addressId);
                setSelectedAddress(addr);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to load checkout data");
        } finally {
            setLoading(false);
        }
    };

    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleOnlinePayment = async () => {
        const res = await loadRazorpay();
        if (!res) {
            alert('Razorpay SDK failed to load. Are you online?');
            return;
        }

        try {
            setLoading(true);
            const orderRes = await apiService.post('/payment/create-order', {
                amount: summary.total,
                userId: currentUser.uid
            });

            if (!orderRes.success) {
                alert("Server error. Are you online?");
                setLoading(false);
                return;
            }

            const { order } = orderRes;
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_RL7iTlLIMH8nZY",
                amount: order.amount,
                currency: order.currency,
                name: "FreshCart",
                description: "Order Payment",
                order_id: order.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await apiService.post('/payment/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            userId: currentUser.uid,
                            items: cartItems,
                            totalAmount: summary.total,
                            taxDetails: summary.details, // Pass detailed tax info
                            shippingAddress: selectedAddress
                        });

                        if (verifyRes.success) {
                            navigate(`/order-success/${verifyRes.orderId}`);
                        } else {
                            alert(verifyRes.message || "Payment verification failed");
                        }
                    } catch (error) {
                        console.error(error);
                        alert("Payment verification failed");
                    }
                },
                prefill: {
                    name: currentUser.displayName || "",
                    email: currentUser.email || "",
                    contact: currentUser.phoneNumber || ""
                },
                theme: { color: "#16a34a" }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
            setLoading(false); // Razorpay is open, we can stop loading
        } catch (error) {
            console.error(error);
            alert("Payment initialization failed");
            setLoading(false);
        }
    };

    const handleCODPayment = async () => {
        try {
            setLoading(true);
            const res = await apiService.post('/payment/place-cod-order', {
                userId: currentUser.uid,
                items: cartItems,
                totalAmount: summary.total,
                taxDetails: summary.details, // Pass detailed tax info
                shippingAddress: selectedAddress
            });

            if (res.success) {
                navigate(`/order-success/${res.orderId}`);
            } else {
                alert(res.message || "Failed to place order");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to place order. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = () => {
        if (!selectedAddress) {
            alert("Address not selected");
            return;
        }
        if (paymentMethod === 'online') {
            handleOnlinePayment();
        } else {
            handleCODPayment();
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans">

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout & Payment</h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Column: Details */}
                    <div className="lg:w-2/3 space-y-6">

                        {/* 1. Order Items (Enhanced Display) */}
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                Order Items ({cartItems.length})
                            </h2>
                            <div className="space-y-4">
                                {cartItems.map(item => (
                                    <div key={item.productId} className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                        <div className="w-20 h-20 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                                            {item.image ? (
                                                <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-2xl">📦</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800">{item.productName}</h3>
                                            <p className="text-sm text-gray-500">Quantity: {item.quantity} {item.unit || ''}</p>
                                            <p className="text-sm font-medium text-green-600">
                                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price)} x {item.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right font-bold text-gray-800">
                                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.price * item.quantity)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Delivery Address */}
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Delivery Address
                            </h2>
                            {selectedAddress ? (
                                <div className="text-gray-600 ml-8">
                                    <p className="font-bold text-gray-800">{currentUser.displayName || "Customer"}</p>
                                    <p>{selectedAddress.houseNumber}, {selectedAddress.street}</p>
                                    <p>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.zipCode}</p>
                                    <p>{selectedAddress.country}</p>
                                    <p className="mt-1 text-sm text-gray-500">Phone: {currentUser.phoneNumber || "N/A"}</p>
                                </div>
                            ) : <p className="text-red-500">Address not loaded</p>}
                        </div>
                    </div>

                    {/* Right Column: Payment & Summary */}
                    <div className="lg:w-1/3 space-y-6">

                        {/* ✅ Estimated Delivery Time */}
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <span>🕐</span> Delivery Estimate
                            </h2>
                            {cartItems.length > 0 && selectedAddress ? (
                                <DeliveryEstimate
                                    storeAddress={cartItems[0]?.storeAddress || null}
                                    prepMins={parseFloat(cartItems[0]?.preparationTime) || 0}
                                    savedAddress={selectedAddress}
                                />
                            ) : (
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                    <div className="flex items-center gap-2 text-sm text-blue-500">
                                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                        Loading estimate...
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Payment Method Selection */}
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">Payment Method</h2>
                            <div className="space-y-3">
                                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-200'}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="online"
                                        checked={paymentMethod === 'online'}
                                        onChange={() => setPaymentMethod('online')}
                                        className="h-5 w-5 text-green-600 focus:ring-green-500"
                                    />
                                    <div className="ml-3 flex-1">
                                        <span className="block font-medium text-gray-900">Online Payment</span>
                                        <span className="block text-sm text-gray-500">Cards, UPI, Netbanking (Razorpay)</span>
                                    </div>
                                    <div className="text-2xl">💳</div>
                                </label>

                                <label className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-200'}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="cod"
                                        checked={paymentMethod === 'cod'}
                                        onChange={() => setPaymentMethod('cod')}
                                        className="h-5 w-5 text-green-600 focus:ring-green-500"
                                    />
                                    <div className="ml-3 flex-1">
                                        <span className="block font-medium text-gray-900">Cash on Delivery</span>
                                        <span className="block text-sm text-gray-500">Pay when you receive</span>
                                    </div>
                                    <div className="text-2xl">💵</div>
                                </label>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">Order Summary</h2>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-medium">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.subtotal)}</span>
                                </div>
                                {summary.details ? (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">
                                                Delivery Fee
                                                {summary.details.breakdown.delivery.value === 0 && <span className="text-green-600 ml-1">(Free!)</span>}
                                            </span>
                                            <span className="font-medium">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.details.breakdown.delivery.value)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Platform Fee</span>
                                            <span className="font-medium">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.details.breakdown.platformFee.value)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">CGST (2.5%)</span>
                                            <span className="font-medium">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.details.totals.totalCGST)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">SGST (2.5%)</span>
                                            <span className="font-medium">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.details.totals.totalSGST)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">TCS (1%)</span>
                                            <span className="font-medium">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.details.breakdown.tcs.amount)}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tax Estimate</span>
                                        <span className="font-medium">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.tax)}</span>
                                    </div>
                                )}
                                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                                    <span>Total Amount</span>
                                    <span className="text-green-600">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(summary.total)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handlePayment}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition shadow-lg flex items-center justify-center gap-2"
                            >
                                <span>{paymentMethod === 'cod' ? 'Place Order' : 'Pay Now'}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                            </button>

                            {paymentMethod === 'online' && (
                                <p className="text-xs text-gray-400 mt-4 text-center flex items-center justify-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                    Secured by Razorpay
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
