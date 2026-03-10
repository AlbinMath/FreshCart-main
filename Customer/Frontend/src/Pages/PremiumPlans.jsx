import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Check, Star, Shield, Zap, Clock, Truck, ShoppingBag, Gift, Heart, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PremiumPlans = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    // Modal state
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [taxData, setTaxData] = useState(null);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await axios.get('http://localhost:5001/api/public/premium-plans');
            setPlans(res.data || []);
        } catch (error) {
            console.error("Error fetching premium plans", error);
            toast.error("Could not load premium plans.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlan = async (plan) => {
        if (!currentUser) {
            toast.error("Please log in to purchase a plan.");
            navigate('/login', { state: { from: '/premium-plans' } });
            return;
        }

        setSelectedPlan(plan);
        // Pre-calculate tax (mock approach for frontend display before actual purchase)
        try {
            let price = 0;
            if (plan.price.toLowerCase() !== 'free') {
                const match = plan.price.match(/\d+/);
                if (match) price = parseInt(match[0], 10);
            }

            if (price > 0) {
                const taxPayload = {
                    items: [{
                        id: plan._id,
                        name: plan.name,
                        price: price,
                        category: 'premium',
                        quantity: 1
                    }],
                    deliveryFee: 0,
                    platformFee: 0
                };
                const taxRes = await axios.post(`http://localhost:5005/api/v1/tax/calculate`, taxPayload);
                if (taxRes.data && taxRes.data.success) {
                    setTaxData(taxRes.data.data.totals);
                }
            } else {
                setTaxData(null); // Free plan
            }
        } catch (err) {
            console.error("Error calculating tax preview", err);
        }
    };

    const handlePurchase = async () => {
        if (!currentUser || !selectedPlan) return;
        setIsProcessing(true);

        try {
            if (selectedPlan.price.toLowerCase() === 'free') {
                const res = await axios.post('http://localhost:5001/api/public/premium-plans/purchase-free', {
                    userId: currentUser.uid,
                    planId: selectedPlan._id
                });
                if (res.data) {
                    toast.success(`Successfully subscribed to ${selectedPlan.name} Plan!`);
                    setSelectedPlan(null);
                    window.location.reload(); // Reload to refresh profile data in AuthContext
                }
                setIsProcessing(false);
                return;
            }

            // 1. Create Razorpay order specifically for Plan
            const { data: orderData } = await axios.post('http://localhost:5001/api/public/premium-plans/create-razorpay-order', {
                userId: currentUser.uid,
                planId: selectedPlan._id
            });

            if (!orderData.success) {
                throw new Error("Failed to create plan checkout session");
            }

            // 2. Open Razorpay Checkout Modal
            const options = {
                key: orderData.key_id,
                amount: orderData.order.amount,
                currency: "INR",
                name: "FreshCart Premium",
                description: `Subscription: ${selectedPlan.name} Plan`,
                image: "https://cdn-icons-png.flaticon.com/512/3643/3643948.png", // Prevent dashboard CORS issues
                order_id: orderData.order.id,
                prefill: {
                    name: currentUser.displayName || currentUser.name || "Customer",
                    email: currentUser.email,
                },
                theme: {
                    color: "#eab308" // Yellow theme matching premium UI
                },
                handler: async function (response) {
                    try {
                        toast.loading('Verifying payment...', { id: 'payment-verify' });

                        // 3. Verify Payment
                        const verificationRes = await axios.post('http://localhost:5001/api/public/premium-plans/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            userId: currentUser.uid,
                            planId: selectedPlan._id,
                            taxAmount: taxData ? taxData.totalTax : 0,
                            grandTotal: orderData.totalAmount,
                            durationDays: 30 // Handled in backend realistically based on plan duration string matching
                        });

                        if (verificationRes.data.success) {
                            toast.success(`Successfully subscribed to ${selectedPlan.name} Plan!`, { id: 'payment-verify' });
                            setSelectedPlan(null);
                            window.location.reload(); // Reload to refresh profile data in AuthContext
                        } else {
                            toast.error(verificationRes.data.message || "Verification failed", { id: 'payment-verify' });
                        }
                    } catch (verifyErr) {
                        toast.error("Payment verification failed. If money was deducted, contact support.", { id: 'payment-verify' });
                    }
                }
            };

            const rzp = new window.Razorpay(options);

            rzp.on('payment.failed', function (response) {
                toast.error("Payment was cancelled or failed.");
            });

            rzp.open();

        } catch (error) {
            console.error("Error initiating plan purchase", error);
            toast.error(error.message || error.response?.data?.msg || "Failed to initiate purchase.");
        } finally {
            setIsProcessing(false);
        }
    };

    const getIcon = (iconName) => {
        const icons = { Check, Star, Shield, Zap, Clock, Truck, ShoppingBag, Gift, Heart, Crown };
        const Icon = icons[iconName] || Truck;
        return <Icon size={32} strokeWidth={1.5} />;
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading plans...</div>;
    }

    return (
        <div className="bg-gray-50 min-h-screen py-16 px-4">
            <div className="max-w-7xl mx-auto space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                        Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-600">Premium</span> Delivery
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Get faster deliveries, exclusive discounts, and VIP support with our premium customer plans.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                    {plans.map((plan) => {
                        const isActive = currentUser?.activePremiumPlan?.planId === plan._id && currentUser?.activePremiumPlan?.status === 'active';

                        return (
                            <div key={plan._id} className={`bg-white rounded-3xl p-8 flex flex-col relative border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${plan.recommended ? 'border-yellow-400 shadow-lg scale-105 z-10' : 'border-gray-200'} ${isActive ? 'ring-4 ring-green-500 ring-opacity-50 border-green-500' : ''}`}>
                                {plan.recommended && !isActive && (
                                    <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs font-bold text-center py-2 uppercase tracking-widest rounded-t-3xl">
                                        Most Popular
                                    </div>
                                )}
                                {isActive && (
                                    <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold text-center py-2 uppercase tracking-widest rounded-t-3xl shadow-sm">
                                        Current Active Plan
                                    </div>
                                )}

                                <div className={`mt-${plan.recommended ? '6' : '0'} flex flex-col items-center text-center gap-4`}>
                                    <div className={`p-4 rounded-2xl ${plan.recommended ? 'bg-yellow-50 text-yellow-500' : 'bg-blue-50 text-blue-500'}`}>
                                        {getIcon(plan.icon)}
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                                    <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{plan.duration}</p>

                                    <div className="flex items-baseline justify-center gap-1 my-2">
                                        <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                                        {plan.price.toLowerCase() !== 'free' && <span className="text-gray-500">/mo</span>}
                                    </div>

                                    <p className="text-sm text-gray-600 min-h-[40px]">{plan.description}</p>
                                </div>

                                <div className="mt-8 flex-1">
                                    <ul className="space-y-4">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-3">
                                                <Check className="w-5 h-5 text-green-500 shrink-0" />
                                                <span className="text-sm text-gray-700">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-100">
                                    <button
                                        onClick={() => !isActive && handleSelectPlan(plan)}
                                        disabled={isActive}
                                        className={`w-full py-4 rounded-xl font-bold text-white transition-all ${isActive
                                                ? 'bg-green-500 cursor-not-allowed opacity-90'
                                                : plan.recommended
                                                    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:shadow-lg hover:shadow-yellow-500/30'
                                                    : 'bg-gray-900 hover:bg-gray-800'
                                            }`}
                                    >
                                        {isActive ? 'Active Plan' : (plan.price.toLowerCase() === 'free' ? 'Get Started' : 'Subscribe Now')}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Purchase Modal */}
            {selectedPlan && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
                        <div className="p-6 bg-gray-50 border-b border-gray-100 text-center">
                            <h3 className="text-2xl font-bold text-gray-900">Confirm Purchase</h3>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-gray-600">{selectedPlan.name} Plan</span>
                                <span className="font-bold">{selectedPlan.price}</span>
                            </div>

                            {selectedPlan.price.toLowerCase() !== 'free' && taxData && (
                                <div className="space-y-3 pt-6 border-t border-gray-100 text-sm">
                                    <div className="flex justify-between text-gray-500">
                                        <span>Subtotal</span>
                                        <span>₹{taxData.subtotal}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-500">
                                        <span>Taxes (GST)</span>
                                        <span>₹{taxData.totalTax}</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-bold pt-4 border-t border-gray-100 text-gray-900">
                                        <span>Total</span>
                                        <span>₹{taxData.grandTotal}</span>
                                    </div>
                                </div>
                            )}

                            {selectedPlan.price.toLowerCase() === 'free' && (
                                <div className="text-center text-green-600 font-medium">
                                    No payment required for this plan.
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
                            <button
                                onClick={() => setSelectedPlan(null)}
                                className="flex-1 py-3 rounded-xl font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePurchase}
                                disabled={isProcessing}
                                className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PremiumPlans;
