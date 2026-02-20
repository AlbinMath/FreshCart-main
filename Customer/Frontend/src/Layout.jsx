import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './navbar/Navbar';
import Footer from './navbar/Footer';

import ChatBot from './components/ChatBot';

export default function Layout() {
    const location = useLocation();

    // Paths where we might NOT want the Navbar/Footer (e.g., separate login layout?)
    // For now, assuming user wants them globally based on "all site format"
    // But typically Login/Register might be standalone. 
    // However, the "FreshCart" aesthetic suggests a consistent header. 
    // Let's keep them everywhere for now as requested.

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans text-gray-900">
            <Navbar />
            <main className="flex-grow w-full">
                <Outlet />
            </main>
            <Footer />
            <ChatBot />
        </div>
    );
}
