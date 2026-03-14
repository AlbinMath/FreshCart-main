import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layout/DashboardLayout';
import LoginPage from './pages/Login';
import DashboardOverview from './pages/DashboardOverview';
import UserManagement from './pages/UserManagement';
import ProductApproval from './pages/ProductApproval';
import Orders from './pages/Orders';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import MarketingPromotions from './pages/MarketingPromotions';
import PremiumDelivery from './pages/PremiumDelivery';
import SplashScreen from './pages/SplashScreen';
import Sellers from './pages/Sellers';
import Customers from './pages/Customers';

import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

function App() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate initial loading sequence
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2500); // 2.5 seconds splash screen

        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return <SplashScreen />;
    }

    return (
        <Router>
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route path="/" element={<Navigate to="/dashboard/overview" replace />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardLayout />}>
                        <Route path="overview" element={<DashboardOverview />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="product-approval" element={<ProductApproval />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="payments" element={<Payments />} />
                        <Route path="reports" element={<Reports />} />
                        <Route path="marketing" element={<MarketingPromotions />} />
                        <Route path="premium-delivery" element={<PremiumDelivery />} />

                        {/* New Sections */}
                        <Route path="sellers" element={<Sellers />} />
                        <Route path="customers" element={<Customers />} />


                        {/* Add other routes here */}
                    </Route>
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
