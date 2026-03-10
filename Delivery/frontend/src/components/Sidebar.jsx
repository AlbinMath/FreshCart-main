import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutGrid, Truck, DollarSign, MapPin, Settings, LogOut } from 'lucide-react';
import deliveryImg from '../img/delivery.png';

const Sidebar = () => {
    const navigate = useNavigate();

    // Retrieve agent name from local storage
    const agentData = JSON.parse(localStorage.getItem('agent') || '{}');
    const agentName = agentData.fullName || 'Delivery Agent';

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('agent');
        navigate('/login');
    };

    const navItems = [
        { icon: LayoutGrid, label: 'Dashboard', path: '/dashboard' },
        { icon: Truck, label: 'My Deliveries', path: '/my-delivery', badge: 3 },
        { icon: DollarSign, label: 'Earnings', path: '/earnings' },
        { icon: MapPin, label: 'Location Tracking', path: '/tracking' },
        { icon: Settings, label: 'Profile Settings', path: '/settings' },
    ];

    return (
        <div className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-50">
            {/* Logo Area */}
            <div className="p-6">
                <div className="flex items-center gap-3">
                    <img src={deliveryImg} alt="Logo" className="w-10 h-10 object-contain" />
                    <span className="text-green-600 text-2xl font-bold">Fresh Cart</span>
                </div>

                {/* User Welcome Block */}
                <div className="mt-6">
                    <div className="text-sm text-gray-500">
                        Welcome back, <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-xs ml-1">Delivery Agent</span>
                    </div>
                    <div className="font-semibold text-gray-800 text-lg mt-1">
                        {agentName}
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-2 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-green-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`
                        }
                    >
                        <div className="flex items-center gap-3">
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </div>
                        {item.badge && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${window.location.pathname === item.path
                                ? 'bg-white text-green-600'
                                : 'bg-red-500 text-white'
                                }`}>
                                {item.badge}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 space-y-2">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
