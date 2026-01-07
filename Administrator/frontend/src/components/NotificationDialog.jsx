import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Bell, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const NotificationDialog = ({ open, onOpenChange }) => {
    // Dummy notifications removed
    const notifications = [];

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case 'info': return <Info className="h-5 w-5 text-blue-500" />;
            default: return <Bell className="h-5 w-5 text-gray-500" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications
                    </DialogTitle>
                    <DialogDescription>
                        You have {notifications.filter(n => !n.read).length} unread notifications.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4 pt-4">
                        {notifications.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>No new notifications</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`flex gap-4 p-4 rounded-lg border transition-colors ${notification.read ? 'bg-white border-gray-100' : 'bg-blue-50 border-blue-100'
                                        }`}
                                >
                                    <div className="mt-1">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <p className="font-medium text-sm leading-none">{notification.title}</p>
                                            <span className="text-xs text-gray-400">{notification.time}</span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            {notification.message}
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
