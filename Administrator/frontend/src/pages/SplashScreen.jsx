import React from 'react';
import { ShoppingBag } from 'lucide-react';

const SplashScreen = () => {
    return (
        <div className="fixed inset-0 bg-premium-gradient flex flex-col items-center justify-center z-50">
            <div className="flex flex-col items-center animate-fade-in-up">
                <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-green-300 to-green-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
                    <div className="relative bg-white p-6 rounded-3xl shadow-2xl mb-8 flex items-center justify-center">
                        <ShoppingBag size={64} className="text-green-600" strokeWidth={1.5} />
                    </div>
                </div>

                <h1 className="text-5xl font-extrabold tracking-tighter mb-4 text-gray-900">
                    Fresh<span className="bg-gradient-to-r from-green-500 to-green-700 bg-clip-text text-transparent">Cart</span>
                </h1>
                <p className="text-gray-500 font-medium tracking-widest uppercase text-sm mb-12">Administrator Panel</p>

                <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-green-600 animate-progress origin-left"></div>
                </div>
            </div>
        </div>
    );
};

// Add custom animation styles if not present in tailwind config
const styleScript = document.createElement('style');
styleScript.innerHTML = `
    @keyframes progress {
        0% { width: 0%; }
        100% { width: 100%; }
    }
    .animate-progress {
        animation: progress 2.5s ease-in-out forwards;
    }
    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up {
        animation: fadeInUp 0.8s ease-out forwards;
    }
`;
document.head.appendChild(styleScript);

export default SplashScreen;
