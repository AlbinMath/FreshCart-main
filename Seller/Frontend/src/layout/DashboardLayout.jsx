import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { Toaster } from 'sonner';

const DashboardLayout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('sellerToken');
        if (!token) {
            navigate('/seller-login');
        }
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Sidebar />

            <DashboardHeader />

            {/* Main Content Area */}
            <main className="ml-64 p-6 pt-6">
                <Outlet />
            </main>
            <Toaster />
        </div>
    );
};

export default DashboardLayout;
