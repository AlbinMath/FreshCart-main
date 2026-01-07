import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Home,
    Users,
    CheckCircle,
    ListOrdered,
    DollarSign,
    FileText,
    LogOut,
    Bell
} from 'lucide-react';
import NotificationDialog from './NotificationDialog';

const Sidebar = () => {
    const menuItems = [
        { icon: Home, label: 'Overview', path: '/dashboard/overview' },
        { icon: Users, label: 'User Management', path: '/dashboard/users' },

        { icon: CheckCircle, label: 'Product Approval', path: '/dashboard/product-approval' },
        { icon: ListOrdered, label: 'Order Monitoring', path: '/dashboard/orders' },
        { icon: DollarSign, label: 'Marketing & Promotions', path: '/dashboard/marketing' }, // Reusing DollarSign for now or import Tag if available, but staying safe with existing imports


        { icon: DollarSign, label: 'Payment Requests', path: '/dashboard/payments' },
        { icon: FileText, label: 'Reports', path: '/dashboard/reports' },
    ];

    const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        // Clear token
        localStorage.removeItem('adminToken');
        // Redirect to login
        navigate('/login');
    };

    return (
        <>
            <aside className="w-64 bg-white border-r h-screen fixed left-0 top-0 flex flex-col z-50">
                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                            FC
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-green-700">FreshCart</h1>
                            <p className="text-sm text-gray-500">Administrator Dashboard</p>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-green-50 text-green-700'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`
                                }
                            >
                                <item.icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* Bottom Actions */}
                <div className="p-4 border-t bg-white space-y-2">
                    <button
                        onClick={() => setIsNotificationsOpen(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-left"
                    >
                        <Bell size={20} />
                        <span className="font-medium">Notifications</span>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            <NotificationDialog
                open={isNotificationsOpen}
                onOpenChange={setIsNotificationsOpen}
            />
        </>
    );
};

export default Sidebar;
