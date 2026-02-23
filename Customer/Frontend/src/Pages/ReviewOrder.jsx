import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../navbar/Navbar';
import apiService from '../services/apiService';

export default function ReviewOrder() {
    const { orderId, productId } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [productDetails, setProductDetails] = useState(null);

    useEffect(() => {
        if (orderId && currentUser) {
            fetchReview();
        }
        if (productId) {
            fetchProductDetails();
        }
    }, [orderId, productId, currentUser]);

    const fetchProductDetails = async () => {
        try {
            const response = await apiService.get(`/public/product/${productId}`);
            if (response.success) {
                setProductDetails(response.product);
            }
        } catch (error) {
            console.error("Failed to fetch product details:", error);
        }
    };

    const fetchReview = async () => {
        try {
            const url = productId
                ? `/reviews/order/${orderId}/product/${productId}`
                : `/reviews/order/${orderId}`;
            const response = await apiService.get(url);
            if (response.success && response.review) {
                const review = response.review;
                setFormData({
                    productRate: review.productRate || 0,
                    qualityRate: review.qualityRate || 0,
                    deliveryRate: review.deliveryRate || 0,
                    overallRate: review.overallRate || 0,
                    likeFeatures: review.likeFeatures || [],
                    reviewText: review.reviewText || '',
                    suggestion: review.suggestion || '',
                    deliveryReview: review.deliveryReview || ''
                });
                setIsEditing(true);
            }
        } catch (error) {
            // It's okay if not found, means new review
            console.log("No existing review found or error fetching:", error);
        }
    };

    const [formData, setFormData] = useState({
        productRate: 0,
        qualityRate: 0,
        deliveryRate: 0,
        overallRate: 0,
        likeFeatures: [],
        reviewText: '',
        suggestion: '',
        deliveryReview: ''
    });

    const featuresList = ["Fast Delivery", "Good Packaging", "Value for Money", "Fresh Products", "Support Service"];

    const handleStarClick = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFeatureToggle = (feature) => {
        setFormData(prev => {
            const features = prev.likeFeatures.includes(feature)
                ? prev.likeFeatures.filter(f => f !== feature)
                : [...prev.likeFeatures, feature];
            return { ...prev, likeFeatures: features };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.deliveryRate || !formData.overallRate || !formData.reviewText) {
            alert("Please fill in all mandatory fields (Delivery Rate, Overall Rate, and Review)");
            return;
        }

        console.log("Submitting Review with:", {
            userId: currentUser?.uid,
            orderId,
            ...formData
        });

        if (!currentUser) {
            alert("You must be logged in to submit a review.");
            return;
        }

        try {
            setLoading(true);
            let response;
            const submitData = {
                userId: currentUser.uid,
                orderId,
                productId,
                ...formData
            };

            if (isEditing) {
                // Update endpoint might need productId too if we want to be specific
                response = await apiService.put(`/reviews/update/${orderId}`, submitData);
            } else {
                response = await apiService.post('/reviews/create', submitData);
            }

            if (response.success) {
                setShowSuccess(true);
                setTimeout(() => {
                    navigate('/orders');
                }, 3000);
            } else {
                alert(response.message || "Failed to submit review");
            }
        } catch (error) {
            console.error("Review submission error:", error);
            alert("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const StarRating = ({ field, label, required }) => (
        <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => handleStarClick(field, star)}
                        className={`text-2xl transition transform hover:scale-110 ${star <= formData[field] ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                        ★
                    </button>
                ))}
            </div>
        </div>
    );

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
                <div className="bg-white p-12 rounded-2xl shadow-xl text-center max-w-md w-full animate-fade-in-up">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-green-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">Thank You!</h2>
                    <p className="text-gray-600 mb-8 text-lg">Your feedback helps us improve our service.</p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
                        <div className="bg-green-600 h-1.5 rounded-full animate-progress" style={{ width: '100%' }}></div>
                    </div>
                    <p className="text-sm text-gray-400">Redirecting to home...</p>
                </div>
                <style>{`
                    @keyframes progress {
                        from { width: 0%; }
                        to { width: 100%; }
                    }
                    .animate-progress {
                        animation: progress 3s linear;
                    }
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .animate-fade-in-up {
                        animation: fadeInUp 0.5s ease-out;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-12">

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Rate Your Experience</h1>

                    {productDetails && (
                        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl border">
                            <img
                                src={productDetails.image || (productDetails.images && productDetails.images[0])}
                                alt={productDetails.productName}
                                className="h-20 w-20 object-cover rounded-lg border shadow-sm"
                            />
                            <div>
                                <h3 className="font-bold text-gray-900">{productDetails.productName}</h3>
                                <p className="text-sm text-gray-500">{productDetails.category}</p>
                                <p className="text-xs text-gray-400 mt-1">Order #{orderId?.slice(-6)}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Star Ratings */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                            <StarRating field="productRate" label="Product Rating" />
                            <StarRating field="qualityRate" label="Quality Rating" />
                            <StarRating field="deliveryRate" label="Delivery Rating" required />
                            <StarRating field="overallRate" label="Overall Rating" required />
                        </div>

                        {/* Like Features */}
                        <div className="mb-6">
                            <label className="block text-gray-700 font-medium mb-2">What did you like?</label>
                            <div className="flex flex-wrap gap-2">
                                {featuresList.map(feature => (
                                    <button
                                        key={feature}
                                        type="button"
                                        onClick={() => handleFeatureToggle(feature)}
                                        className={`px-3 py-1 rounded-full text-sm border transition ${formData.likeFeatures.includes(feature)
                                            ? 'bg-green-100 border-green-500 text-green-800'
                                            : 'bg-white border-gray-300 text-gray-600 hover:border-green-400'
                                            }`}
                                    >
                                        {feature}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Review Text */}
                        <div className="mb-4">
                            <label className="block text-gray-700 font-medium mb-1">
                                Write a Review <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                rows="3"
                                placeholder="Share your experience..."
                                value={formData.reviewText}
                                onChange={(e) => setFormData({ ...formData, reviewText: e.target.value })}
                                required
                            />
                        </div>

                        {/* Suggestion */}
                        <div className="mb-4">
                            <label className="block text-gray-700 font-medium mb-1">Any Suggestions?</label>
                            <textarea
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                rows="2"
                                placeholder="How can we improve?"
                                value={formData.suggestion}
                                onChange={(e) => setFormData({ ...formData, suggestion: e.target.value })}
                            />
                        </div>

                        {/* Delivery Review */}
                        <div className="mb-6">
                            <label className="block text-gray-700 font-medium mb-1">Delivery Review</label>
                            <textarea
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                rows="2"
                                placeholder="Comments about delivery..."
                                value={formData.deliveryReview}
                                onChange={(e) => setFormData({ ...formData, deliveryReview: e.target.value })}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Submitting...' : (isEditing ? 'Update Review' : 'Submit Review')}
                        </button>

                        <div className="mt-4 text-center">
                            <button
                                type="button"
                                onClick={() => navigate('/orders')}
                                className="text-gray-600 hover:text-green-600 font-medium transition"
                            >
                                Back to My Orders
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
