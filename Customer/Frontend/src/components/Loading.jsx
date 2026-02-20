import React from 'react';

const Loading = () => {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">

            <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-500 font-medium">Loading FreshCart...</p>
            </div>
        </div>
    );
};

export default Loading;
