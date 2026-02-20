import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Profile from "./Pages/Profile";
import AddAddress from "./Pages/AddAddress";
import Cart from "./Pages/Cart";
import ForgotPassword from "./Pages/ForgotPassword";
import ChangePassword from "./Pages/ChangePassword";
import CheckoutAddress from "./Pages/CheckoutAddress";
import CheckoutPayment from "./Pages/CheckoutPayment";
import OrderSuccess from "./Pages/OrderSuccess";
import Orders from "./Pages/Orders";
import ReviewOrder from "./Pages/ReviewOrder";
import ProductDetails from "./Pages/ProductDetails";
import ReportIssue from "./Pages/ReportIssue";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./Layout";
import Loading from "./components/Loading";

function AppContent() {
    const [splashLoading, setSplashLoading] = useState(true);
    const { currentUser, loading: authLoading } = useAuth();
    const location = useLocation();

    useEffect(() => {
        const timer = setTimeout(() => {
            setSplashLoading(false);
        }, 2500); // 2.5 seconds splash screen

        return () => clearTimeout(timer);
    }, []);

    if (splashLoading || authLoading) {
        return <Loading />;
    }

    // Redirect to Login if not logged in and not on a public page
    // Public pages: /login, /register, /forgot-password
    const publicPaths = ['/login', '/register', '/forgot-password'];
    const isPublicPath = publicPaths.includes(location.pathname);

    if (!currentUser && !isPublicPath) {
        return <Navigate to="/login" replace />;
    }

    return (
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/add-address" element={<AddAddress />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/product/:productId" element={<ProductDetails />} />
                <Route path="/checkout/address" element={<CheckoutAddress />} />
                <Route path="/checkout/payment" element={<CheckoutPayment />} />
                <Route path="/order-success/:orderId" element={<OrderSuccess />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/rate-order/:orderId" element={<ReviewOrder />} />
                <Route path="/report-issue" element={<ReportIssue />} />
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </Router>
    );
}

export default App;
