import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingScreen = ({ text = "Loading..." }) => {
    return (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin text-green-600" />
                <p className="text-lg font-medium text-gray-600 animate-pulse">{text}</p>
            </div>
        </div>
    );
};

export default LoadingScreen;
