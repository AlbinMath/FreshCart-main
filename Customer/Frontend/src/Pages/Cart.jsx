import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { cartService } from '../services/cartService';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Cart() {
    const { currentUser } = useAuth();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [taxDetails, setTaxDetails] = useState(null);
    const [calculatingTax, setCalculatingTax] = useState(false);
    const [coupons, setCoupons] = useState([]);
    const [copiedCode, setCopiedCode] = useState(null);

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

    useEffect(() => {
        if (currentUser) {
            fetchCart();
            fetchActiveCoupons();
        } else {
            setLoading(false);
        }
    }, [currentUser]);

    const fetchActiveCoupons = async () => {
        try {
            const res = await fetch(`${API_BASE}/marketing/active-coupons`);
            const data = await res.json();
            if (Array.isArray(data)) setCoupons(data);
        } catch (err) {
            console.error('Failed to fetch coupons', err);
        }
    };

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopiedCode(code);
            setTimeout(() => setCopiedCode(null), 2000);
        });
    };

    const fetchCart = async () => {
        try {
            setLoading(true);
            const response = await cartService.getCart(currentUser.uid);
            if (response.success && response.cart) {
                setCartItems(response.cart.items || []);
            }
        } catch (err) {
            console.error("Failed to fetch cart", err);
            setError("Failed to load your cart.");
        } finally {
            setLoading(false);
        }
    };

    const fetchTaxDetails = async (items) => {
        if (!items || items.length === 0) {
            setTaxDetails(null);
            return;
        }

        try {
            setCalculatingTax(true);
            const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

            // Calculate delivery fee based on active plan rules
            let deliveryFee = 50; // standard fallback
            const activePlan = currentUser?.activePremiumPlan;

            if (activePlan && activePlan.status === 'active') {
                const planName = activePlan.planName.toLowerCase();
                if (planName === 'elite' || planName === 'premium') {
                    deliveryFee = 0;
                } else if (planName === 'plus') {
                    deliveryFee = subtotal > 200 ? 0 : 40;
                } else if (planName === 'lite') {
                    deliveryFee = subtotal > 500 ? 0 : 50;
                }
            } else {
                // Generic logic if no premium plan
                if (subtotal > 1000) {
                    deliveryFee = 0;
                } else if (subtotal >= 600) {
                    deliveryFee = 10;
                }
            }

            const platformFee = 5;

            const taxRes = await fetch('http://localhost:5005/api/v1/tax/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: items.map(i => ({ ...i, category: 'basic' })),
                    deliveryFee,
                    platformFee
                })
            });
            const taxData = await taxRes.json();

            if (taxData.success) {
                setTaxDetails(taxData.data);
            }
        } catch (err) {
            console.error("Failed to calculate tax", err);
        } finally {
            setCalculatingTax(false);
        }
    };

    useEffect(() => {
        if (cartItems.length > 0) {
            fetchTaxDetails(cartItems);
        } else {
            setTaxDetails(null);
        }
    }, [cartItems]);

    const handleQuantityChange = async (productId, newQuantity) => {
        if (newQuantity < 1) return;

        const item = cartItems.find(i => i.productId === productId);
        if (item && item.stock && newQuantity > item.stock) {
            showToast(`Only ${item.stock} units available in stock`, 'warning');
            return;
        }

        try {
            // Optimistic update
            const oldItems = [...cartItems];
            setCartItems(items => items.map(item =>
                item.productId === productId ? { ...item, quantity: newQuantity } : item
            ));

            const response = await cartService.updateQuantity(currentUser.uid, productId, newQuantity);
            if (!response.success) {
                // Revert on failure
                setCartItems(oldItems);
                showToast("Failed to update quantity", 'error');
            }
        } catch (err) {
            console.error(err);
            fetchCart(); // Re-fetch to sync
        }
    };

    const handleRemove = (productId) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="font-medium text-gray-900">Are you sure you want to remove this item?</p>
                <div className="flex justify-end gap-2 mt-1">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                const response = await cartService.removeFromCart(currentUser.uid, productId);
                                if (response.success) {
                                    setCartItems(items => items.filter(item => item.productId !== productId));
                                    showToast("Item removed from cart", 'success');
                                } else {
                                    showToast("Failed to remove item", 'error');
                                }
                            } catch (err) {
                                console.error(err);
                                showToast("Error removing item", 'error');
                            }
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors shadow-sm"
                    >
                        Remove
                    </button>
                </div>
            </div>
        ), {
            duration: Infinity,
            position: 'top-center'
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(price);
    };

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col font-sans">

                <div className="flex-grow flex items-center justify-center px-4">
                    <div className="text-center max-w-md w-full bg-white p-8 rounded-lg shadow-md">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Please Log in</h2>
                        <p className="text-gray-500 mb-6">You need to be logged in to view and manage your shopping cart.</p>
                        <Link
                            to="/login"
                            className="block w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition shadow-sm"
                        >
                            Go to Login
                        </Link>
                        <div className="mt-4">
                            <Link to="/" className="text-sm text-green-600 hover:text-green-500 hover:underline">
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        );
    }

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex flex-col">

            <div className="flex-grow flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans">

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">Shopping Cart</h1>

                {cartItems.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                        <div className="text-6xl mb-4">🛒</div>
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
                        <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
                        <Link to="/" className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition">
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Cart Items List */}
                        <div className="lg:w-2/3">
                            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                                <ul className="divide-y divide-gray-200">
                                    {cartItems.map((item) => (
                                        <li key={item.productId} className="p-6 flex flex-col sm:flex-row items-center gap-4">
                                            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.productName} className="h-full w-full object-cover object-center" />
                                                ) : (
                                                    <div className="h-full w-full bg-gray-100 flex items-center justify-center text-2xl">📦</div>
                                                )}
                                            </div>

                                            <div className="flex-1 flex flex-col sm:flex-row justify-between w-full">
                                                <div>
                                                    <h3 className="text-lg font-medium text-gray-900">
                                                        <Link to={`/product/${item.productId}`} className="hover:text-green-600">
                                                            {item.productName}
                                                        </Link>
                                                    </h3>
                                                    <div className="text-xs text-gray-500 mt-1 space-y-1">
                                                        <p>Product ID: <span className="font-mono">{item.product_id || item.productId}</span></p>
                                                        <p>Seller ID: <span className="font-mono">{item.sellerUniqueId || 'Unknown'}</span></p>
                                                    </div>
                                                    <p className="mt-1 text-sm font-medium text-green-600">
                                                        {formatPrice(item.price)} {item.unit ? `per ${item.unit}` : ''}
                                                    </p>
                                                </div>

                                                <div className="mt-4 sm:mt-0 flex items-center gap-4">
                                                    <div className="flex items-center border border-gray-300 rounded-md">
                                                        <button
                                                            onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                                            className="px-3 py-1 hover:bg-gray-100 text-gray-600 disabled:opacity-50"
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            -
                                                        </button>
                                                        <span className="px-3 py-1 font-medium text-gray-900">{item.quantity}</span>
                                                        <button
                                                            onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                                            className="px-3 py-1 hover:bg-gray-100 text-gray-600 disabled:opacity-50"
                                                            disabled={item.stock && item.quantity >= item.stock}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemove(item.productId)}
                                                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Active Coupons Section */}
                            {coupons.length > 0 && (
                                <div className="mt-6 bg-white rounded-lg shadow-md p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
                                        </svg>
                                        <h2 className="text-base font-semibold text-gray-800">Available Coupons</h2>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{coupons.length} active</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {coupons.map(coupon => (
                                            <div key={coupon._id} className="relative bg-gradient-to-r from-green-50 to-emerald-50 border border-dashed border-green-300 rounded-xl p-4 overflow-hidden">
                                                {/* Decorative notch circles */}
                                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full border border-gray-200"></div>
                                                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-50 rounded-full border border-gray-200"></div>

                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        {/* Discount label */}
                                                        <span className="inline-block bg-green-600 text-white text-xs font-extrabold px-2.5 py-1 rounded-md mb-1.5">
                                                            {coupon.discountType === 'PERCENTAGE'
                                                                ? `${coupon.discountValue}% OFF`
                                                                : `Rs.${coupon.discountValue} OFF`}
                                                        </span>
                                                        <p className="text-xs text-gray-500">
                                                            Valid: {coupon.validFromDate} &mdash; {coupon.validToDate}
                                                        </p>
                                                        {coupon.keywords?.length > 0 && (
                                                            <p className="text-xs text-gray-400 mt-0.5 truncate">{coupon.keywords.join(', ')}</p>
                                                        )}
                                                    </div>

                                                    {/* Copyable code button */}
                                                    <button
                                                        onClick={() => handleCopyCode(coupon.code)}
                                                        title="Click to copy coupon code"
                                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-mono font-bold transition-all duration-200 flex-shrink-0 select-none ${copiedCode === coupon.code
                                                                ? 'bg-green-600 text-white border-green-600 scale-95 shadow-inner'
                                                                : 'bg-white text-green-700 border-green-400 hover:bg-green-100 shadow-sm'
                                                            }`}
                                                    >
                                                        {copiedCode === coupon.code ? (
                                                            <>
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                Copied!
                                                            </>
                                                        ) : (
                                                            <>
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                </svg>
                                                                {coupon.code}
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-3 text-center">
                                        &#128203; Click a coupon code to copy &mdash; paste it at checkout to save
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:w-1/3">
                            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
                                {calculatingTax ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                                    </div>
                                ) : (
                                    <dl className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <dt className="text-sm text-gray-600">Subtotal</dt>
                                            <dd className="text-sm font-medium text-gray-900">{formatPrice(subtotal)}</dd>
                                        </div>

                                        {taxDetails ? (
                                            <>
                                                <div className="flex items-center justify-between text-sm">
                                                    <dt className="text-gray-500">
                                                        Delivery Fee
                                                        {taxDetails.breakdown.delivery.value === 0 && <span className="text-green-600 ml-1">(Free!)</span>}
                                                    </dt>
                                                    <dd className="font-medium text-gray-900">
                                                        {formatPrice(taxDetails.breakdown.delivery.value)}
                                                    </dd>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <dt className="text-gray-500">Platform Fee</dt>
                                                    <dd className="font-medium text-gray-900">
                                                        {formatPrice(taxDetails.breakdown.platformFee.value)}
                                                    </dd>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <dt className="text-gray-500">CGST (2.5%)</dt>
                                                    <dd className="font-medium text-gray-900">
                                                        {formatPrice(taxDetails.totals.totalCGST)}
                                                    </dd>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <dt className="text-gray-500">SGST (2.5%)</dt>
                                                    <dd className="font-medium text-gray-900">
                                                        {formatPrice(taxDetails.totals.totalSGST)}
                                                    </dd>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <dt className="text-gray-500">TCS (1%)</dt>
                                                    <dd className="font-medium text-gray-900">
                                                        {formatPrice(taxDetails.breakdown.tcs.amount)}
                                                    </dd>
                                                </div>
                                                <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                                                    <dt className="text-base font-semibold text-gray-900">Order Total</dt>
                                                    <dd className="text-xl font-bold text-green-600">{formatPrice(taxDetails.totals.grandTotal)}</dd>
                                                </div>

                                                {/* Delivery Info */}
                                                {subtotal > 1000 && (
                                                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                                                        <p className="text-xs text-green-800 font-medium">
                                                            🎉 You got FREE delivery!
                                                        </p>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-sm text-gray-500 text-center py-4">
                                                Add items to see pricing details
                                            </div>
                                        )}
                                    </dl>
                                )}

                                <div className="mt-6">
                                    <Link to="/checkout/address" className="block w-full text-center bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition shadow-sm">
                                        Proceed to Checkout
                                    </Link>
                                </div>
                                <div className="mt-4 text-center">
                                    <Link to="/" className="text-sm text-green-600 hover:text-green-500 hover:underline">
                                        or Continue Shopping
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}
