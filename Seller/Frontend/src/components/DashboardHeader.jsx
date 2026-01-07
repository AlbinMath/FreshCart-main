import React, { useEffect, useState, useRef } from 'react';
import { User, Store, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import NotificationDialog from './NotificationDialog';
import { Toaster, toast } from 'sonner';

const DashboardHeader = () => {
    const [storeName, setStoreName] = useState('My Store');
    const [managerName, setManagerName] = useState('Store Manager');
    const [notifications, setNotifications] = useState([]);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const socketRef = useRef(null);

    // Initial Load & Socket Connection
    useEffect(() => {
        let sellerId = null;
        try {
            const sellerInfo = JSON.parse(localStorage.getItem('sellerInfo'));
            if (sellerInfo) {
                if (sellerInfo.user) {
                    setStoreName(sellerInfo.user.storeName || 'My Store');
                    setManagerName(sellerInfo.user.name || 'Store Manager');
                    sellerId = sellerInfo.user._id;
                } else if (sellerInfo.storeName) {
                    setStoreName(sellerInfo.storeName);
                    setManagerName(sellerInfo.name || 'Store Manager');
                    sellerId = sellerInfo._id || sellerInfo.sellerId;
                }
            }
        } catch (e) {
            console.error("Failed to parse seller info", e);
        }

        // Connect to Socket.io
        if (sellerId && !socketRef.current) {
            // Assuming the backend is running on the URL defined in .env or localhost:5002 if dev
            const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5002';

            socketRef.current = io(socketUrl);

            socketRef.current.on('connect', () => {
                console.log("Connected to socket server");
                socketRef.current.emit('join_seller_room', sellerId);
            });

            socketRef.current.on('newOrder', (notification) => {
                console.log("New notification received:", notification);

                // Add to list
                setNotifications(prev => [notification, ...prev]);

                // Show floating toast
                toast.info(notification.title, {
                    description: notification.description,
                    duration: 5000,
                });

                // Optional: Play sound
                const audio = new Audio('/notification-sound.mp3'); // Ensure this file exists or remove
                audio.play().catch(e => console.log("Audio play failed", e));
            });
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-30 ml-64">
            {/* Include Toaster for notifications */}
            <Toaster position="top-right" />

            <div className="flex flex-col">
                <span className="text-sm text-gray-500">Welcome back,</span>
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    {storeName}
                </h1>
            </div>

            <div className="flex items-center gap-4">

                {/* Notification Bell */}
                <button
                    onClick={() => setIsNotificationOpen(true)}
                    className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <Bell className="h-6 w-6 text-gray-600" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                            {unreadCount}
                        </span>
                    )}
                </button>

                <Link to="/profile" className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border hover:bg-gray-100 transition-colors">
                    <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <User className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden md:block">{managerName}</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-bold">Store</span>
                </Link>
            </div>

            <NotificationDialog
                open={isNotificationOpen}
                onOpenChange={setIsNotificationOpen}
                notifications={notifications}
            />
        </header>
    );
};

export default DashboardHeader;
