import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/ui/button';
import { cn } from '@/ui/utils';

const ProductImageSlider = ({ images = [], fallbackImage, alt, className }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Normalize images array
    const imageList = (images && images.length > 0) ? images : (fallbackImage ? [fallbackImage] : []);

    if (imageList.length === 0) {
        return (
            <div className="h-48 w-full bg-gray-100 flex items-center justify-center text-gray-400">
                No Image
            </div>
        );
    }

    const nextImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % imageList.length);
    };

    const prevImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
    };

    return (
        <div className={cn("h-48 w-full bg-gray-100 relative group overflow-hidden", className)}>
            <img
                src={imageList[currentIndex]}
                alt={alt}
                className="w-full h-full object-cover transition-transform duration-500 ease-in-out"
            />

            {imageList.length > 1 && (
                <>
                    <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-white/70 hover:bg-white shadow-sm"
                            onClick={prevImage}
                        >
                            <ChevronLeft className="h-4 w-4 text-gray-800" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-white/70 hover:bg-white shadow-sm"
                            onClick={nextImage}
                        >
                            <ChevronRight className="h-4 w-4 text-gray-800" />
                        </Button>
                    </div>
                    {/* Dots indicator */}
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                        {imageList.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 w-1.5 rounded-full transition-colors ${idx === currentIndex ? 'bg-white' : 'bg-white/50'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ProductImageSlider;
