import React, { useEffect, useState, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/ui/dialog";
import { Badge } from "@/ui/badge";
import { ScrollArea } from "@/ui/scroll-area";
import { Star, User, ThumbsUp, Package, Truck, MessageSquare, Heart, CheckCircle2, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

const ProductReviewsDialog = ({ open, onOpenChange, product }) => {
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        if (open && product?._id) {
            setReviews([]);
            setPage(1);
            fetchInitialData();
        }
    }, [open, product]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const nameParam = product.productName ? `&productName=${encodeURIComponent(product.productName)}` : '';
            
            const [reviewsRes, statsRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL}/reviews/product/${product._id}?page=1&limit=8${nameParam}`),
                fetch(`${import.meta.env.VITE_API_URL}/reviews/stats/${product._id}?productName=${encodeURIComponent(product.productName)}`)
            ]);

            if (reviewsRes.ok) {
                const data = await reviewsRes.json();
                setReviews(data.reviews || []);
                setHasMore(data.pagination?.hasMore || false);
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

    const fetchMoreReviews = async () => {
        if (loadingMore || !hasMore) return;
        
        try {
            setLoadingMore(true);
            const nextPage = page + 1;
            const nameParam = product.productName ? `&productName=${encodeURIComponent(product.productName)}` : '';
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/reviews/product/${product._id}?page=${nextPage}&limit=8${nameParam}`);
            
            if (res.ok) {
                const data = await res.json();
                setReviews(prev => [...prev, ...(data.reviews || [])]);
                setPage(nextPage);
                setHasMore(data.pagination?.hasMore || false);
            }
        } catch (error) {
            console.error("Failed to fetch more reviews:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    const observerTarget = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loadingMore) {
                    fetchMoreReviews();
                }
            },
            { threshold: 0.1, rootMargin: '100px' }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, loadingMore, page]);

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
            <DialogContent className="max-w-4xl max-h-[85vh] h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
                <DialogHeader className="p-8 pb-6 bg-white/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            {product.image || (product.images && product.images.length > 0) ? (
                                <img
                                    src={product.image || product.images[0]}
                                    alt={product.productName}
                                    className="h-20 w-20 object-cover rounded-2xl shadow-lg ring-4 ring-white transition-transform duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <div className="h-20 w-20 bg-gray-100 rounded-2xl flex items-center justify-center border shadow-inner">
                                    <Package className="h-10 w-10 text-gray-300" />
                                </div>
                            )}
                            <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white">
                                <Heart className="h-3 w-3 fill-current" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                                Customer Feedback
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium text-sm flex items-center gap-2">
                                Insights for <span className="text-slate-900 font-bold">{product.productName}</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden relative">
                    <ScrollArea className="h-full px-8">
                        {loading ? (
                            <div className="py-24 flex flex-col items-center gap-4">
                                <div className="h-12 w-12 rounded-full border-4 border-slate-100 border-t-green-500 animate-spin" />
                                <p className="text-slate-400 font-medium animate-pulse">Aggregating reviews...</p>
                            </div>
                        ) : (
                            <div className="pb-12 pt-2">
                                {/* Stats Summary */}
                                {stats && stats.totalReviews > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                                        <div className="relative overflow-hidden group p-6 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-100/50 shadow-sm transition-all hover:shadow-md">
                                            <div className="flex flex-col items-center text-center relative z-10">
                                                <div className="flex items-center justify-center gap-1.5 mb-2">
                                                    <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
                                                    <span className="text-4xl font-black text-slate-900 leading-none">{stats.averageRating}</span>
                                                </div>
                                                <p className="text-[10px] text-amber-700/70 font-black uppercase tracking-widest">Global Score</p>
                                            </div>
                                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                                <Star className="h-16 w-16 fill-amber-400" />
                                            </div>
                                        </div>

                                        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50 to-blue-50/30 border border-indigo-100/50 shadow-sm text-center relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-center gap-2 mb-2 text-indigo-700">
                                                    <Package className="h-5 w-5" />
                                                    <span className="text-3xl font-black text-slate-900">{stats.averageProductRate}</span>
                                                </div>
                                                <p className="text-[10px] text-indigo-700/70 font-black uppercase tracking-widest">Product Build</p>
                                            </div>
                                            <Package className="absolute -bottom-2 -right-2 h-12 w-12 text-indigo-200 opacity-20 group-hover:rotate-12 transition-transform duration-500" />
                                        </div>

                                        <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 to-green-50/30 border border-emerald-100/50 shadow-sm text-center relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-center gap-2 mb-2 text-emerald-700">
                                                    <ThumbsUp className="h-5 w-5" />
                                                    <span className="text-3xl font-black text-slate-900">{stats.averageQualityRate}</span>
                                                </div>
                                                <p className="text-[10px] text-emerald-700/70 font-black uppercase tracking-widest">Quality Merit</p>
                                            </div>
                                            <ThumbsUp className="absolute -bottom-2 -right-2 h-12 w-12 text-emerald-200 opacity-20 group-hover:-rotate-12 transition-transform duration-500" />
                                        </div>

                                        <div className="p-6 rounded-3xl bg-gradient-to-br from-violet-50 to-purple-50/30 border border-violet-100/50 shadow-sm text-center relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-center gap-2 mb-2 text-violet-700">
                                                    <Truck className="h-5 w-5" />
                                                    <span className="text-3xl font-black text-slate-900">{stats.averageDeliveryRate}</span>
                                                </div>
                                                <p className="text-[10px] text-violet-700/70 font-black uppercase tracking-widest">Logistic Speed</p>
                                            </div>
                                            <Truck className="absolute -bottom-2 -right-2 h-12 w-12 text-violet-200 opacity-20 group-hover:translate-x-2 transition-transform duration-500" />
                                        </div>
                                    </div>
                                )}

                                {/* Reviews List */}
                                {reviews.length > 0 ? (
                                    <div className="space-y-8">
                                        {reviews.map((review, idx) => (
                                            <div 
                                                key={review._id} 
                                                className="relative group bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.08)] hover:border-slate-200 transition-all duration-500 overflow-hidden"
                                            >
                                                {/* Header Portion */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner group-hover:bg-green-50 group-hover:border-green-100 transition-colors duration-500">
                                                                <User className="h-7 w-7 text-slate-400 group-hover:text-green-500 transition-colors duration-500" />
                                                            </div>
                                                            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white shadow-sm">
                                                                <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="font-bold text-slate-900 text-lg group-hover:text-green-600 transition-colors">Verified Customer</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{format(new Date(review.createdAt), 'MMMM dd, yyyy')}</span>
                                                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                                                <Badge variant="secondary" className="bg-slate-50 text-slate-400 text-[9px] hover:bg-slate-100 transition-colors border-none py-0 px-2 font-mono">#{review.orderId.slice(-8)}</Badge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 flex flex-col items-center gap-1 min-w-[120px]">
                                                        {renderStars(review.overallRate)}
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Excellent</span>
                                                    </div>
                                                </div>

                                                <div className="grid md:grid-cols-[1fr_auto_1fr] gap-8 items-start">
                                                    {/* Rating Matrix */}
                                                    <div className="space-y-4 bg-slate-50/30 p-5 rounded-2xl border border-dotted border-slate-200">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Product</span>
                                                            {renderStars(review.productRate)}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Build Quality</span>
                                                            {renderStars(review.qualityRate)}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Delivery</span>
                                                            {renderStars(review.deliveryRate)}
                                                        </div>
                                                    </div>

                                                    <div className="hidden md:block w-px h-full bg-slate-100" />

                                                    {/* Review Content */}
                                                    <div className="space-y-6">
                                                        <div className="relative">
                                                            <MessageSquare className="absolute -left-6 -top-2 h-4 w-4 text-slate-200 rotate-12" />
                                                            <p className="text-slate-700 text-sm leading-relaxed font-medium italic">
                                                                "{review.reviewText}"
                                                            </p>
                                                        </div>

                                                        {/* Feature Tags */}
                                                        {review.likeFeatures && review.likeFeatures.length > 0 && (
                                                            <div className="flex flex-wrap gap-2">
                                                                {review.likeFeatures.map((feature, fIdx) => (
                                                                    <div key={fIdx} className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold border border-green-100/50">
                                                                        <ThumbsUp className="h-2.5 w-2.5" />
                                                                        {feature}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Meta Feedback */}
                                                {(review.suggestion || review.deliveryReview) && (
                                                    <div className="grid sm:grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-50">
                                                        {review.suggestion && (
                                                            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/30">
                                                                <div className="flex items-center gap-2 mb-2 text-blue-800">
                                                                    <div className="h-6 w-6 rounded-lg bg-blue-100 flex items-center justify-center">
                                                                        <Star className="h-3 w-3 fill-blue-600" />
                                                                    </div>
                                                                    <span className="text-[10px] font-black uppercase tracking-widest">Growth Hint</span>
                                                                </div>
                                                                <p className="text-[12px] text-blue-700/80 font-medium leading-relaxed leading-tight">
                                                                    {review.suggestion}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {review.deliveryReview && (
                                                            <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100/30">
                                                                <div className="flex items-center gap-2 mb-2 text-purple-800">
                                                                    <div className="h-6 w-6 rounded-lg bg-purple-100 flex items-center justify-center">
                                                                        <Truck className="h-3 w-3" />
                                                                    </div>
                                                                    <span className="text-[10px] font-black uppercase tracking-widest">Logistics Note</span>
                                                                </div>
                                                                <p className="text-[12px] text-purple-700/80 font-medium leading-relaxed leading-tight">
                                                                    {review.deliveryReview}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                    {/* Scroll Sensor */}
                                    {hasMore && (
                                        <div ref={observerTarget} className="pt-12 flex flex-col items-center justify-center pb-20">
                                            <div className="h-10 w-10 relative mb-4">
                                                <div className="absolute inset-0 rounded-full border-2 border-slate-100 shadow-inner" />
                                                <div className="absolute inset-0 rounded-full border-t-2 border-green-500 animate-spin" />
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] animate-pulse">Syncing more reviews...</span>
                                        </div>
                                    )}

                                    {!hasMore && reviews.length > 5 && (
                                        <div className="text-center py-10 opacity-30">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">End of records</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-24 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100 mx-4">
                                    <div className="relative inline-block mb-8">
                                        <div className="h-24 w-24 rounded-3xl bg-white shadow-xl flex items-center justify-center mx-auto">
                                            <MessageSquare className="h-12 w-12 text-slate-200" />
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-green-500 shadow-lg flex items-center justify-center border-4 border-white">
                                            <Star className="h-4 w-4 fill-white text-white animate-pulse" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">No Reviews Yet</h3>
                                    <p className="text-sm text-slate-500 mt-2 max-w-[240px] mx-auto font-medium leading-relaxed">
                                        Be the first to share your experience and help others make a better choice.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>

                    {/* Scroll Indicator Backdrop */}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10" />
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProductReviewsDialog;
