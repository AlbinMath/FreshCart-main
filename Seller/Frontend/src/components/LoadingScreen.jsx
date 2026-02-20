import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen = () => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-green-50">
            <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-green-200 animate-pulse"></div>
                    <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-t-green-600 animate-spin"></div>
                </div>
                <h1 className="text-2xl font-bold text-green-800 tracking-wider animate-pulse">
                    FreshCart Seller
                </h1>
                <p className="text-sm text-green-600 font-medium">
                    Preparing your dashboard...
                </p>
            </div>
        </div>
    );
};

export default LoadingScreen;
