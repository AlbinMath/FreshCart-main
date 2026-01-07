import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Alert, AlertDescription } from '@/ui/alert';
import { Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UpdatePassword = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        // Basic Validation
        if (formData.newPassword.length < 6) {
            setError("New password must be at least 6 characters long.");
            setLoading(false);
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError("New passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            const sellerInfoStr = localStorage.getItem('sellerInfo');
            if (!sellerInfoStr) {
                navigate('/seller-login');
                return;
            }

            const sellerInfo = JSON.parse(sellerInfoStr);
            const seller = sellerInfo.user || sellerInfo;

            const response = await fetch(`${import.meta.env.VITE_API_URL}/seller/update-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sellerId: seller._id,
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(data.message || "Password updated successfully!");
                setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });

                // Optional: Logout user to re-login? Or keep logged in. 
                // Usually keeping logged in is fine for simple update.
            } else {
                setError(data.message || "Failed to update password.");
            }
        } catch (err) {
            console.error("Update password error:", err);
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto space-y-6 pt-8">
            <Button variant="ghost" className="mb-4" onClick={() => navigate('/profile')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Profile
            </Button>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <Lock className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle>Update Password</CardTitle>
                            <CardDescription>Ensure your account is secure using a strong password.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {success && (
                        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                            <AlertDescription>{success}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                                placeholder="Enter current password"
                                required
                                value={formData.currentPassword}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                placeholder="Enter new password"
                                required
                                value={formData.newPassword}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="Confirm new password"
                                required
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>

                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Update Password
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default UpdatePassword;
