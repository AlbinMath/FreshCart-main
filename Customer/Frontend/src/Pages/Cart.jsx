import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { cartService } from '../services/cartService';
import Navbar from '../navbar/Navbar';
import Footer from '../navbar/Footer';
import { Link } from 'react-router-dom';

export default function Cart() {
    const { currentUser } = useAuth();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (currentUser) {
            fetchCart();
        } else {
            setLoading(false);
        }
    }, [currentUser]);

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

    const handleQuantityChange = async (productId, newQuantity) => {
        if (newQuantity < 1) return;

        const item = cartItems.find(i => i.productId === productId);
        if (item && item.stock && newQuantity > item.stock) {
            alert(`Only ${item.stock} units available in stock`);
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
                alert("Failed to update quantity");
            }
        } catch (err) {
            console.error(err);
            fetchCart(); // Re-fetch to sync
        }
    };

    const handleRemove = async (productId) => {
        if (!window.confirm("Are you sure you want to remove this item?")) return;
        try {
            const response = await cartService.removeFromCart(currentUser.uid, productId);
            if (response.success) {
                setCartItems(items => items.filter(item => item.productId !== productId));
            } else {
                alert("Failed to remove item");
            }
        } catch (err) {
            console.error(err);
            alert("Error removing item");
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(price);
    };

    const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const tax = subtotal * 0.05; // 5% tax example
    const total = subtotal + tax;

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
                <Navbar />
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
                <Footer />
            </div>
        );
    }

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
                                                    <p className="mt-1 text-sm text-gray-500">Seller ID: {item.sellerId || 'Ref-Seller'}</p>
                                                    <p className="mt-1 text-sm font-medium text-green-600">{formatPrice(item.price)}</p>
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
                        </div>

                        {/* Order Summary */}
                        <div className="lg:w-1/3">
                            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
                                <dl className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <dt className="text-sm text-gray-600">Subtotal</dt>
                                        <dd className="text-sm font-medium text-gray-900">{formatPrice(subtotal)}</dd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <dt className="text-sm text-gray-600">Tax estimate (5%)</dt>
                                        <dd className="text-sm font-medium text-gray-900">{formatPrice(tax)}</dd>
                                    </div>
                                    <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                                        <dt className="text-base font-medium text-gray-900">Order Total</dt>
                                        <dd className="text-xl font-bold text-gray-900">{formatPrice(total)}</dd>
                                    </div>
                                </dl>

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
            <Footer />
        </div>
    );
}
