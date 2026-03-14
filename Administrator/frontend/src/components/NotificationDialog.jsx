import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Bell, CheckCircle, AlertTriangle, Info, Trash2, XCircle } from 'lucide-react';

const NotificationDialog = ({ open, onOpenChange }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications');
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [open]);

    const markAsRead = async (id) => {
        try {
            const response = await fetch(`/api/notifications/${id}/read`, {
                method: 'PATCH'
            });
            if (response.ok) {
                setNotifications(prev => 
                    prev.map(n => n._id === id ? { ...n, isRead: true } : n)
                );
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const clearAll = async () => {
        if (!window.confirm("Are you sure you want to clear all notifications?")) return;
        try {
            const response = await fetch('/api/notifications', { method: 'DELETE' });
            if (response.ok) {
                setNotifications([]);
            }
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
            case 'info': return <Info className="h-5 w-5 text-blue-500" />;
            default: return <Bell className="h-5 w-5 text-gray-500" />;
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl p-6">
                <DialogHeader>
                    <div className="flex justify-between items-center mb-2">
                        <DialogTitle className="flex items-center gap-3 text-xl font-black text-gray-800">
                            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                                <Bell className="h-5 w-5" />
                            </div>
                            Notifications
                        </DialogTitle>
                        {notifications.length > 0 && (
                            <button 
                                onClick={clearAll}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 rounded-xl"
                                title="Clear All"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <DialogDescription className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                        You have {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[450px] mt-4 -mr-2 pr-4">
                    <div className="space-y-3">
                        {notifications.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                <div className="p-4 bg-gray-50 w-fit mx-auto rounded-3xl mb-4 border border-dashed border-gray-200">
                                    <Bell className="h-10 w-10 text-gray-200" />
                                </div>
                                <p className="font-black text-sm uppercase tracking-tighter">No new notifications</p>
                                <p className="text-xs font-bold mt-1 opacity-60">System alerts will appear here.</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    onClick={() => !notification.isRead && markAsRead(notification._id)}
                                    className={`flex gap-4 p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                                        notification.isRead ? 'bg-white border-gray-50' : 'bg-indigo-50 border-indigo-100 shadow-sm'
                                    }`}
                                >
                                    {!notification.isRead && (
                                        <div className="absolute top-4 right-4 h-2 w-2 bg-indigo-600 rounded-full"></div>
                                    )}
                                    <div className="mt-1">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <p className={`text-sm leading-tight ${notification.isRead ? 'text-gray-700 font-bold' : 'text-indigo-900 font-black'}`}>
                                                {notification.title}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-snug">
                                            {notification.message}
                                        </p>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-2">
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default NotificationDialog;
