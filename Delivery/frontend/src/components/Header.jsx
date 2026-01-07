import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell } from 'lucide-react';

const Header = () => {
    const navigate = useNavigate();
    // Retrieve agent name from local storage
    const agentData = JSON.parse(localStorage.getItem('agent') || '{}');
    const agentName = agentData.fullName || 'User';

    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40 w-full">
            {/* Left Side - Page Title or Context */}
            <div>
                <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
            </div>

            {/* Right Side - Actions & Profile */}
            <div className="flex items-center gap-6">

                {/* User Profile */}
                <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
                    <div className="text-right hidden sm:block">
                        <div className="text-sm font-semibold text-gray-900">{agentName}</div>
                        <div className="text-xs text-green-600 font-medium">Delivery Partner</div>
                    </div>
                    <div
                        onClick={() => navigate('/profile')}
                        className="bg-gray-100 p-2 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                        <User className="w-5 h-5 text-gray-600" />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
