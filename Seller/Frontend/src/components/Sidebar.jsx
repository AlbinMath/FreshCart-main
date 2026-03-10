import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Box,
    Users,
    FileText,
    Settings,
    Bell,
    LogOut,
    Megaphone
} from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/ui/utils';

import NotificationDialog from './NotificationDialog';

const Sidebar = ({ className }) => {
    const navigate = useNavigate();
    const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
    const [pendingOrdersCount, setPendingOrdersCount] = React.useState(0);

    // Fetch Pending Orders Count
    React.useEffect(() => {
        const fetchOrderCount = async () => {
            try {
                const sellerInfoStr = localStorage.getItem('sellerInfo');
                if (!sellerInfoStr) return;

                const parsed = JSON.parse(sellerInfoStr);
                const seller = parsed.user || parsed;
                const idToFetch = seller._id;

                if (!idToFetch) return;

                const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/count/${idToFetch}`);
                if (response.ok) {
                    const data = await response.json();
                    setPendingOrdersCount(data.count);
                }
            } catch (error) {
                console.error("Failed to fetch order count:", error);
            }
        };

        fetchOrderCount();

        // Optional: Poll every minute or listen to socket
        const interval = setInterval(fetchOrderCount, 60000);
        return () => clearInterval(interval);

    }, []);

    const handleLogout = () => {
        localStorage.removeItem('sellerToken');
        localStorage.removeItem('sellerInfo');
        localStorage.removeItem('rememberedEmail'); // Optional: decide if logout clears remember me
        navigate('/seller-login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Store Overview', path: '/' },
        { icon: Package, label: 'Product Catalog', path: '/products' },
        {
            icon: ShoppingCart,
            label: 'Order Processing',
            path: '/orders',
            badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
            badgeColor: 'bg-red-500'
        },
        { icon: Megaphone, label: 'Marketing', path: '/marketing' },
        { icon: FileText, label: 'Reports', path: '/reports' },
        { icon: Settings, label: 'Store Settings', path: '/settings' },
    ];

    return (
        <aside className={cn("w-64 bg-white border-r h-screen flex flex-col fixed left-0 top-0 z-40 transition-transform", className)}>
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b">
                <div className="flex items-center gap-2 text-green-600 font-bold text-xl">
                    <div className="bg-green-600 text-white p-1 rounded-md">
                        <span className="text-sm font-bold">FC</span>
                    </div>
                    <span>Fresh Cart</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                            isActive
                                ? "bg-green-600 text-white shadow-md hover:bg-green-700"
                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </div>
                        {item.badge && (
                            <span className={cn("px-2 py-0.5 rounded-full text-xs text-white", item.badgeColor)}>
                                {item.badge}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t space-y-2">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:bg-gray-100 hover:text-gray-900 px-3"
                    onClick={() => setIsNotificationsOpen(true)}
                >
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                            <Bell className="h-5 w-5" />
                            <span>Notifications</span>
                        </div>
                        <span className="bg-red-500 px-2 py-0.5 rounded-full text-xs text-white">4</span>
                    </div>
                </Button>

                <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 px-3"
                    onClick={handleLogout}
                >
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                </Button>
            </div>

            <NotificationDialog
                open={isNotificationsOpen}
                onOpenChange={setIsNotificationsOpen}
            />
        </aside>
    );
};

export default Sidebar;
