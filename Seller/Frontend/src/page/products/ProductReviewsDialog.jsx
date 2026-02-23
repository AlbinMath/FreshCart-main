import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/ui/dialog";
import { Badge } from "@/ui/badge";
import { ScrollArea } from "@/ui/scroll-area";
import { Star, User, ThumbsUp, Package, Truck } from 'lucide-react';
import { format } from 'date-fns';

const ProductReviewsDialog = ({ open, onOpenChange, product }) => {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open && product?._id) {
            fetchReviews();
        }
    }, [open, product]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const [reviewsRes, statsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/reviews/product/${product._id}`),
                fetch(`${import.meta.env.VITE_API_URL}/reviews/stats/${product._id}`)
            ]);

            if (reviewsRes.ok) {
                const reviewsData = await reviewsRes.json();
                setReviews(reviewsData);
            }

            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                            }`}
                    />
                ))}
            </div>
        );
    };

    if (!product) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-4 border-b">
                    <div className="flex items-center gap-4">
                        {product.image || (product.images && product.images.length > 0) ? (
                            <img
                                src={product.image || product.images[0]}
                                alt={product.productName}
                                className="h-16 w-16 object-cover rounded-lg border shadow-sm"
                            />
                        ) : (
                            <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center border">
                                <Package className="h-8 w-8 text-gray-400" />
                            </div>
                        )}
                        <div>
                            <DialogTitle className="text-2xl">Customer Reviews</DialogTitle>
                            <DialogDescription>
                                Reviews for {product.productName}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6">
                    {loading ? (
                        <div className="py-12 text-center text-gray-500">Loading reviews...</div>
                    ) : (
                        <div className="space-y-6 pb-6">
                            {/* Stats Summary */}
                            {stats && stats.totalReviews > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                            <span className="text-2xl font-bold">{stats.averageRating}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">Overall Rating</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <Package className="h-5 w-5 text-blue-600" />
                                            <span className="text-2xl font-bold">{stats.averageProductRate}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">Product Quality</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <ThumbsUp className="h-5 w-5 text-green-600" />
                                            <span className="text-2xl font-bold">{stats.averageQualityRate}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">Quality Rating</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <Truck className="h-5 w-5 text-purple-600" />
                                            <span className="text-2xl font-bold">{stats.averageDeliveryRate}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">Delivery Rating</p>
                                    </div>
                                </div>
                            )}

                            {/* Reviews List */}
                            {reviews.length > 0 ? (
                                <div className="space-y-4">
                                    {reviews.map((review) => (
                                        <div key={review._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                        <User className="h-5 w-5 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">Customer</p>
                                                        <p className="text-xs text-gray-500">
                                                            {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    {renderStars(review.overallRate)}
                                                    <Badge variant="outline" className="text-xs">
                                                        Order #{review.orderId.slice(-6)}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Rating Breakdown */}
                                            <div className="grid grid-cols-3 gap-2 mb-3 p-3 bg-gray-50 rounded">
                                                <div className="text-center">
                                                    <p className="text-xs text-gray-500 mb-1">Product</p>
                                                    {renderStars(review.productRate)}
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-gray-500 mb-1">Quality</p>
                                                    {renderStars(review.qualityRate)}
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs text-gray-500 mb-1">Delivery</p>
                                                    {renderStars(review.deliveryRate)}
                                                </div>
                                            </div>

                                            {/* Review Text */}
                                            <div className="space-y-2">
                                                <p className="text-sm text-gray-700">{review.reviewText}</p>

                                                {review.suggestion && (
                                                    <div className="p-2 bg-blue-50 rounded text-sm">
                                                        <span className="font-medium text-blue-900">Suggestion: </span>
                                                        <span className="text-blue-700">{review.suggestion}</span>
                                                    </div>
                                                )}

                                                {review.deliveryReview && (
                                                    <div className="p-2 bg-purple-50 rounded text-sm">
                                                        <span className="font-medium text-purple-900">Delivery: </span>
                                                        <span className="text-purple-700">{review.deliveryReview}</span>
                                                    </div>
                                                )}

                                                {review.likeFeatures && review.likeFeatures.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {review.likeFeatures.map((feature, idx) => (
                                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                                <ThumbsUp className="h-3 w-3 mr-1" />
                                                                {feature}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Reviews Yet</h3>
                                    <p className="text-sm text-gray-500">
                                        This product hasn't received any customer reviews yet.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default ProductReviewsDialog;
