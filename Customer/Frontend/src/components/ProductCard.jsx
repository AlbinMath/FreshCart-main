import React from 'react';
import { ShoppingBag } from 'lucide-react';

const ProductCard = ({ data }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full max-w-[240px] my-2 transition-transform hover:scale-[1.02]">
            {data.image && (
                <div className="h-32 w-full bg-gray-50 relative">
                    <img
                        src={data.image}
                        alt={data.name}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <div className="p-3">
                <h4 className="font-semibold text-gray-800 text-sm truncate">{data.name}</h4>
                <div className="flex bg-gray-50 rounded-lg p-2 mt-2 justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Price</span>
                        <span className="font-bold text-fresh-600">₹{data.price}/{data.unit}</span>
                    </div>
                    <button className="bg-fresh-500 hover:bg-fresh-600 text-white p-2 rounded-full shadow-lg transition-colors">
                        <ShoppingBag size={14} />
                    </button>
                </div>
                <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-1">
                    <span>🏪</span> {data.store}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
