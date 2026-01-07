import React from 'react';
import { Bell, User } from 'lucide-react';

const DashboardHeader = () => {
    return (
        <header className="bg-white border-b h-16 flex items-center justify-between px-8 sticky top-0 z-10">
            <div>
                <h2 className="text-xl font-bold text-gray-800">Dashboard Overview</h2>
                <p className="text-sm text-gray-500">Welcome back, Administrator. Here's what's happening with your platform.</p>
            </div>

            <div className="flex items-center gap-4">
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                <div className="flex items-center gap-3 pl-4 border-l">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        A
                    </div>
                    <span className="font-medium text-gray-700">Administrator</span>
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
