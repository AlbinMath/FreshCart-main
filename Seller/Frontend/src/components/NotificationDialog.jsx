import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/ui/dialog";
import { ScrollArea } from "@/ui/scroll-area";
import { Bell, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/ui/button';


const NotificationDialog = ({ open, onOpenChange, notifications = [] }) => {

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] flex flex-col max-h-[85vh]">
                <DialogHeader className="pb-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" /> Notifications
                    </DialogTitle>
                    <DialogDescription>
                        Stay updated with your store activities.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4 -mr-4">
                    <div className="space-y-4 py-4">
                        {notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`flex gap-4 p-3 rounded-lg border transition-colors ${notification.read ? 'bg-white border-gray-100' : 'bg-blue-50/50 border-blue-100'}`}
                                >
                                    <div className="mt-1">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className={`text-sm font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                                                {notification.title}
                                            </h4>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                {notification.time}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            {notification.description}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-400 space-y-2">
                                <Bell className="h-12 w-12 mx-auto opacity-20" />
                                <p>No new notifications</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="pt-4 border-t mt-auto">
                    <Button variant="ghost" className="w-full text-xs text-gray-500 h-8">
                        Mark all as read
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NotificationDialog;
