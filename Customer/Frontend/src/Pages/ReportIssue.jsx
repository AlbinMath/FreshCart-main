import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import { useNavigate } from 'react-router-dom';

function ReportIssue() {
    const { currentUser, getUserProfile } = useAuth();
    const navigate = useNavigate();
    const profile = getUserProfile();

    const [issueType, setIssueType] = useState('Wrong Product');
    const [orderId, setOrderId] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (!currentUser) {
            setMessage({ type: 'error', text: 'You must be logged in to report an issue.' });
            return;
        }

        if (!description.trim()) {
            setMessage({ type: 'error', text: 'Please provide a description of the issue.' });
            return;
        }

        setLoading(true);

        try {
            const reportData = {
                userId: currentUser.uid,
                userEmail: currentUser.email,
                userName: currentUser.name || currentUser.displayName || profile?.displayName || 'Valued Customer',
                issueType,
                orderId: orderId.trim() || null,
                description: description.trim()
            };

            const response = await apiService.post('/reports', reportData);

            if (response.success) {
                const reportId = response.report?.reportId || 'Generated';
                setMessage({ type: 'success', text: `Report submitted successfully! Your Report ID is: ${reportId}. Resolution details will be mailed to you shortly.` });
                setIssueType('Wrong Product');
                setOrderId('');
                setDescription('');
                // Optional: redirect after delay
                // setTimeout(() => navigate('/'), 3000);
            } else {
                setMessage({ type: 'error', text: response.message || 'Failed to submit report.' });
            }
        } catch (error) {
            console.error('Error reporting issue:', error);
            setMessage({ type: 'error', text: 'An error occurred. Please try again later.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-8">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
                        Report an Issue
                    </h2>

                    {message.text && (
                        <div className={`mb-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Issue Type */}
                        <div>
                            <label htmlFor="issueType" className="block text-sm font-medium text-gray-700 mb-1">
                                Issue Type
                            </label>
                            <select
                                id="issueType"
                                value={issueType}
                                onChange={(e) => setIssueType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="Wrong Product">Wrong Product Received</option>
                                <option value="Delivery Issue">Delivery Issue</option>
                                <option value="Refund Issue">Refund Request/Issue</option>
                                <option value="Website Issue">Website Bug/Issue</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {/* Order ID (Optional) */}
                        <div>
                            <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-1">
                                Order ID <span className="text-gray-400 text-xs">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                id="orderId"
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                placeholder="e.g., ORD-12345"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                id="description"
                                rows="5"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Please describe the issue in detail..."
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ReportIssue;
