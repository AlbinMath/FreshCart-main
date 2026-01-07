import React, { useState, useEffect } from 'react';

const ProductCardImage = ({ images, altText }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    // Auto-slide disabled by user request
    // useEffect(() => {
    //     if (!images || images.length <= 1 || isHovered) return;
    //     const interval = setInterval(() => {
    //         setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    //     }, 5000); 
    //     return () => clearInterval(interval);
    // }, [images, isHovered]);

    if (!images || images.length === 0) {
        return (
            <div className="text-gray-400 text-4xl flex items-center justify-center w-full h-full bg-gray-200">
                📦
            </div>
        );
    }

    return (
        <div
            className="w-full h-full relative overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <img
                src={images[currentImageIndex]}
                alt={altText}
                className="w-full h-full object-cover transition-opacity duration-300"
                onError={(e) => {
                    e.target.style.display = 'none';
                    // Fallback handled by parent or logic? 
                    // If image fails, maybe show next? simpler: just hide.
                }}
            />
            {/* Optional: Add dots indicator if needed, but might clutter card. Keeping it clean for now. */}
            {images.length > 1 && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                    {images.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'w-3 bg-white' : 'w-1.5 bg-white/50'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductCardImage;
