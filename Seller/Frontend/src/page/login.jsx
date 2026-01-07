import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/ui/card';
import { Label } from '@/ui/label';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { Alert, AlertDescription } from '@/ui/alert';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/ui/checkbox';
import Navbar from '@/components/Navbar';

const Login = () => {
    // ... (rest of state logic usually unchanged, but using replace_file_content needs context)
    // Actually simpler to just replace the header block inside the return.
    // Waiting for tool execution to replace efficiently.
    // Since I have to provide StartLine/EndLine, I will do a targeted replace for the return block.
    // ...
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [rememberMe, setRememberMe] = useState(false);

    // Load saved email if 'Remember Me' was used
    React.useEffect(() => {
        const savedEmail = localStorage.getItem('rememberedEmail');
        if (savedEmail) {
            setFormData(prev => ({ ...prev, email: savedEmail }));
            setRememberMe(true);
        }
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/seller/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                // Save or remove email based on "Remember Me"
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', formData.email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                localStorage.setItem('sellerToken', data.token);
                localStorage.setItem('sellerInfo', JSON.stringify(data));
                navigate('/');
            } else {
                setError(data.message || 'Invalid email or password');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Header */}
            <Navbar showRegisterButton={true} />

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-[450px] shadow-xl border-t-4 border-t-green-600">
                    <CardHeader className="space-y-1 text-center pb-8">
                        <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">Sign In</CardTitle>
                        <p className="text-gray-500">Welcome back to FreshCart Seller Portal</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {error && (
                            <Alert variant="destructive" className="animate-in fade-in-50">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    required
                                    className="bg-slate-50 border-gray-200 focus-visible:ring-green-600 h-11"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    required
                                    className="bg-slate-50 border-gray-200 focus-visible:ring-green-600 h-11"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="remember"
                                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                        checked={rememberMe}
                                        onCheckedChange={(checked) => setRememberMe(checked)}
                                    />
                                    <label htmlFor="remember" className="font-medium text-gray-500 cursor-pointer">Remember me</label>
                                </div>
                                <a href="/forgot-password" className="font-medium text-green-600 hover:text-green-700 hover:underline">
                                    Forgot password?
                                </a>
                            </div>

                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-11 text-base font-semibold transition-all hover:scale-[1.01]" type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </form>

                    </CardContent>
                    <CardFooter className="flex justify-center border-t py-6 bg-slate-50/50">
                        <div className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <a
                                href="https://fresh-cart-seller-registrations-m7e.vercel.app/seller-registration"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-green-600 hover:underline font-semibold"
                            >
                                Sign up here
                            </a>
                        </div>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
};

export default Login;
