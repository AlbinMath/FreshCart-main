import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck } from 'lucide-react';

const Welcome = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/login');
        }, 3000); // 3 seconds delay

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-400 to-green-600 text-white">
            <div className="animate-bounce mb-8">
                <Truck size={64} />
            </div>
            <h1 className="text-4xl font-bold mb-4">FreshCart Delivery</h1>
            <p className="text-lg opacity-80">Partner App</p>

            <div className="mt-12 flex space-x-2">
                <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-100"></div>
                <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-200"></div>
                <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-300"></div>
            </div>
        </div>
    );
};

export default Welcome;
