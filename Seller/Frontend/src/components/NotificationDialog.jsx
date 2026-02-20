import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/ui/dialog";
import { Button } from '@/ui/button';
import { ScrollArea } from "@/ui/scroll-area";
import { Bell, Check, Trash2, AlertTriangle, Info, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';

const NotificationDialog = ({ open, onOpenChange, notifications = [], onClear = () => { } }) => {

    // Helper to safely format date
    const formatDate = (dateInput) => {
        try {
            if (!dateInput) return '';
            const date = new Date(dateInput);
            if (isNaN(date.getTime())) return typeof dateInput === 'string' ? dateInput : '';
            return format(date, 'MMM dd, h:mm a');
        } catch (e) {
            return '';
        }
    };

    const getIcon = (type) => {
        if (type === 'low_stock') return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
        if (type === 'info') return <ShoppingBag className="h-5 w-5 text-blue-600" />;
        return <Bell className="h-5 w-5 text-gray-600" />;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[85vh] flex flex-col p-0">
                <DialogHeader className="p-4 pb-2 border-b">
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-gray-700" />
                        <DialogTitle>Notifications</DialogTitle>
                    </div>
                    <DialogDescription>
                        {notifications.length} active alerts
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 p-4">
                    {notifications.length > 0 ? (
                        <div className="space-y-3">
                            {notifications.map((notif) => (
                                <div key={notif._id || notif.id} className="flex gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg group hover:bg-gray-100 transition-colors">
                                    <div className="mt-0.5">
                                        {getIcon(notif.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-800 font-medium leading-tight">
                                            {notif.message || notif.description || notif.title}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatDate(notif.createdAt || notif.time)}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-gray-400 hover:text-green-600 hover:bg-green-50 shrink-0"
                                        onClick={() => onClear(notif._id || notif.id)}
                                        title="Mark as Read"
                                    >
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <Bell className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                            <p>No new notifications</p>
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default NotificationDialog;
