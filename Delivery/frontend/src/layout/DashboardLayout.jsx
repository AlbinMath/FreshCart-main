import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';

const DashboardLayout = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />

            <div className="ml-64">
                <DashboardHeader />

                <main className="p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
