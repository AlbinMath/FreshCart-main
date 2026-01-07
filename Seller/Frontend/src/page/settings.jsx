import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import { Button } from '@/ui/button';
import { Fingerprint, Loader2, CheckCircle, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/ui/alert';

const Settings = () => {
    const [seller, setSeller] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generatedId, setGeneratedId] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSettingsData = async () => {
            const storedInfo = localStorage.getItem('sellerInfo');
            if (storedInfo) {
                const parsed = JSON.parse(storedInfo);
                const sellerId = parsed.user?._id || parsed._id;

                // Set initial from local storage
                setSeller(parsed.user || parsed);
                if (parsed.user?.sellerUniqueId || parsed.sellerUniqueId) {
                    setGeneratedId(parsed.user?.sellerUniqueId || parsed.sellerUniqueId);
                }

                // Fetch fresh from DB to ensure sync
                if (sellerId) {
                    try {
                        const response = await fetch(`${import.meta.env.VITE_API_URL}/seller/profile/${sellerId}`);
                        if (response.ok) {
                            const freshData = await response.json();
                            if (freshData.sellerUniqueId) {
                                setGeneratedId(freshData.sellerUniqueId);

                                // Update LS
                                if (parsed.user) parsed.user = freshData;
                                else Object.assign(parsed, freshData);
                                localStorage.setItem('sellerInfo', JSON.stringify(parsed));
                            }
                        }
                    } catch (e) {
                        console.error("Failed to sync settings", e);
                    }
                }
            }
        };
        fetchSettingsData();
    }, []);

    const updateLocalStorage = (id) => {
        const storedInfo = localStorage.getItem('sellerInfo');
        if (storedInfo) {
            const parsed = JSON.parse(storedInfo);
            if (parsed.user) parsed.user.sellerUniqueId = id;
            else parsed.sellerUniqueId = id;
            localStorage.setItem('sellerInfo', JSON.stringify(parsed));
        }
    };

    const handleGenerateId = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/seller/generate-id`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sellerId: seller._id }),
            });

            const data = await response.json();

            if (response.ok) {
                setGeneratedId(data.sellerUniqueId);
                updateLocalStorage(data.sellerUniqueId);
            } else if (response.status === 400 && data.sellerUniqueId) {
                // ID already exists, just update state
                setGeneratedId(data.sellerUniqueId);
                updateLocalStorage(data.sellerUniqueId);
            } else {
                setError(data.message || 'Failed to generate ID');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!seller) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Store Settings</h2>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Fingerprint className="h-5 w-5 text-purple-600" />
                        Seller Identity
                    </CardTitle>
                    <CardDescription>
                        Manage your unique seller identification credentials.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {!generatedId ? (
                        <div className="space-y-4">
                            <Alert className="bg-blue-50 border-blue-200">
                                <ShieldAlert className="h-4 w-4 text-blue-600" />
                                <AlertTitle className="text-blue-800">Unique ID Generation</AlertTitle>
                                <AlertDescription className="text-blue-700">
                                    You have not generated your Seller Unique ID yet. This ID is permanent and cannot be changed once created. It is used for official verification and support.
                                </AlertDescription>
                            </Alert>

                            {error && <p className="text-sm text-red-600">{error}</p>}

                            <Button
                                onClick={handleGenerateId}
                                disabled={loading}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Generate Unique ID
                            </Button>
                        </div>
                    ) : (
                        <div className="p-6 bg-green-50 border border-green-200 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-green-900">Seller Unique ID Active</h4>
                                    <p className="text-green-700 font-mono text-xl mt-1 tracking-wider">{generatedId}</p>
                                </div>
                            </div>
                            <div className="text-xs text-green-600 bg-white px-3 py-1 rounded-full border border-green-100">
                                Verified & Locked
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
};

export default Settings;
