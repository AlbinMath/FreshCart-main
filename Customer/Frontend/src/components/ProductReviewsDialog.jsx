import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

export default function ProductReviewsDialog({ productId, onClose }) {
    const [reviews, setReviews] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviewData = async () => {
            setLoading(true);
            try {
                const [reviewsRes, summaryRes] = await Promise.all([
                    apiService.get(`/reviews/product/${productId}`),
                    apiService.get(`/reviews/product-summary/${productId}`)
                ]);

                if (reviewsRes.success) setReviews(reviewsRes.reviews);
                if (summaryRes.success) setSummary(summaryRes.summary);
            } catch (err) {
                console.error("Error fetching reviews:", err);
            } finally {
                setLoading(false);
            }
        };

        if (productId) fetchReviewData();
    }, [productId]);

    const renderStars = (rating) => {
        return (
            <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`h-4 w-4 ${i < Math.round(rating) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-md" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="text-xl font-bold text-gray-800">Product Reviews & Analysis</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            <p className="text-gray-500 font-medium">Analyzing reviews...</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary Section */}
                            {summary && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                    <div className="flex flex-col items-center justify-center border-r border-blue-100 pr-6">
                                        <div className="text-5xl font-extrabold text-blue-600 mb-2">{summary.averageRating}</div>
                                        {renderStars(summary.averageRating)}
                                        <div className="text-sm text-blue-400 mt-2 font-medium">Based on {summary.totalReviews} reviews</div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                                            <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wider">AI Analysis Summary</h4>
                                        </div>
                                        
                                        <p className="text-gray-700 text-sm italic leading-relaxed bg-white/50 p-3 rounded-xl border border-blue-100">
                                            "{summary.aiSummary}"
                                        </p>

                                        {summary.aiDetails && (
                                            <div className="grid grid-cols-1 gap-3">
                                                {summary.aiDetails.top_features?.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        <span className="text-[10px] font-bold text-blue-600 uppercase">Top Highlights:</span>
                                                        {summary.aiDetails.top_features.map((f, i) => (
                                                            <span key={i} className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
                                                                #{f.replace(/\s+/g, '')}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                <div className="flex items-center justify-between text-[10px] font-bold">
                                                    <span className="text-blue-600">DELIVERY: <span className="text-gray-700">{summary.aiDetails.delivery_score}</span></span>
                                                    <span className="text-blue-600">SENTIMENT: <span className="text-gray-700">{summary.aiDetails.sentiment}</span></span>
                                                </div>

                                                {summary.aiDetails.improvement_suggestions?.length > 0 && (
                                                    <div className="mt-1 pt-2 border-t border-blue-100">
                                                        <span className="text-[10px] font-bold text-orange-600 uppercase">Buyer Suggestions:</span>
                                                        <p className="text-[10px] text-gray-600 line-clamp-1 mt-1">
                                                            {summary.aiDetails.improvement_suggestions[0]}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Review List */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-gray-800 text-lg border-b pb-2">Top Customer Reviews</h4>
                                {reviews.length > 0 ? (
                                    reviews.map((review, idx) => (
                                        <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                                                        {review.userId.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-gray-700">Verified Buyer</div>
                                                        <div className="text-[10px] text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                                {renderStars(review.overallRate)}
                                            </div>
                                            <p className="text-gray-600 text-sm leading-relaxed">{review.reviewText}</p>
                                            {review.likeFeatures && review.likeFeatures.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {review.likeFeatures.map((f, i) => (
                                                        <span key={i} className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                                            ✓ {f}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        <div className="text-4xl mb-2">💬</div>
                                        <p>No reviews yet for this product.</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-colors shadow-lg"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
