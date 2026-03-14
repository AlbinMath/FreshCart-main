import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Loading Screen
import LoadingScreen from '@/components/LoadingScreen';

import Login from '@/page/login';
import ForgotPassword from '@/page/forgot-password';
import Profile from '@/page/profile';
import Settings from '@/page/settings';
import ProductCatalog from '@/page/products/ProductCatalog';
import AddProduct from '@/page/products/AddProduct';
import DashboardLayout from '@/layout/DashboardLayout';
import StoreOverview from '@/page/Storeoverview';
import Marketing from '@/page/Marketing';
import UpdatePassword from '@/page/UpdatePassword';
import Reports from '@/page/Reports';
import Orders from '@/page/Orders';
import Sourcing from '@/page/Sourcing';
import SVMAnalysis from '@/page/SVMAnalysis';

function App() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate initial loading process
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2000); // 2 seconds loading time

        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <Router>
            <Routes>
                {/* Protected Dashboard Routes */}
                <Route path="/" element={<DashboardLayout />}>
                    <Route index element={<StoreOverview />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="update-password" element={<UpdatePassword />} />

                    <Route path="/products" element={<ProductCatalog />} />
                    <Route path="/products/add" element={<AddProduct />} />
                    <Route path="/products/edit/:id" element={<AddProduct />} />
                    <Route path="/marketing" element={<Marketing />} />

                    <Route path="/orders" element={<Orders />} />
                    <Route path="/sourcing" element={<Sourcing />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/svm-analysis" element={<SVMAnalysis />} />
                </Route>

                {/* Auth Routes */}
                <Route path="/seller-login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
            </Routes>
        </Router>
    );
}

export default App;
