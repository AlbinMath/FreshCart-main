import { motion } from 'framer-motion';
import { ShoppingBag, Package } from 'lucide-react';

const ProductCard = ({ product }) => {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 shadow-sm border border-gray-200 hover:shadow-md transition-all"
        >
            <div className="flex gap-3">
                {/* Product Image */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {product.image ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Package size={24} className="text-gray-400" />
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-800 truncate">
                        {product.name}
                    </h4>
                    <p className="text-xs text-gray-500 capitalize">{product.category}</p>

                    <div className="flex items-center justify-between mt-2">
                        <div>
                            <span className="text-lg font-bold text-green-600">
                                ₹{product.price}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">/{product.unit}</span>
                        </div>

                        {product.stock > 0 ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                In Stock
                            </span>
                        ) : (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                Out of Stock
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* View Button */}
            <button className="w-full mt-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm py-2 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2">
                <ShoppingBag size={16} />
                View Product
            </button>
        </motion.div>
    );
};

export default ProductCard;
