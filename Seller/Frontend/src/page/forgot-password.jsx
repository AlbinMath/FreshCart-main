import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/ui/card';
import { Label } from '@/ui/label';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { Alert, AlertDescription } from '@/ui/alert';
import { Loader2, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simulate API call
        try {
            // await fetch('/api/seller/forgot-password', ...);
            await new Promise(resolve => setTimeout(resolve, 1500)); // Mock delay
            setSubmitted(true);
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Header */}
            <Navbar showRegisterButton={false} />

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-[450px] shadow-xl border-t-4 border-t-green-600">
                    <CardHeader className="space-y-1 text-center pb-8">
                        <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">Forgot Password?</CardTitle>
                        <p className="text-gray-500">
                            {submitted
                                ? "Check your email for reset instructions"
                                : "Enter your email to reset your password"}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {!submitted ? (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        required
                                        className="bg-slate-50 border-gray-200 focus-visible:ring-green-600 h-11"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-11 text-base font-semibold transition-all hover:scale-[1.01]" type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {loading ? 'Sending Link...' : 'Reset Password'}
                                </Button>
                            </form>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="bg-green-50 text-green-700 p-4 rounded-lg text-sm">
                                    We have sent a password reset link to <strong>{email}</strong>. Please check your inbox and spam folder.
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full h-11"
                                    onClick={() => setSubmitted(false)}
                                >
                                    Resend Link
                                </Button>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-center border-t py-6 bg-slate-50/50">
                        <Link to="/seller-login" className="flex items-center text-sm text-gray-600 hover:text-green-600 font-medium transition-colors">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Login
                        </Link>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
};

export default ForgotPassword;
