import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../navbar/Navbar';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, googleSignIn } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/');
            console.error(err);
            setError('Failed to sign in: ' + (err.message || JSON.stringify(err)));
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleSignIn() {
        try {
            setError('');
            setLoading(true);
            const result = await googleSignIn();
            const user = result.user;

            // Sync Google user to backend
            await apiService.post('/users/sync', {
                uid: user.uid,
                email: user.email,
                name: user.displayName,
                phoneNumber: user.phoneNumber,
                role: 'customer', // Default role for Google Sign In
                isVerified: user.emailVerified
            });

            navigate('/');
        } catch (err) {
            console.error(err);
            setError('Failed to sign in with Google: ' + (err.message || JSON.stringify(err)));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                    <div className="text-center">
                        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                            Sign In
                        </h2>
                    </div>
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>}
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md shadow-sm -space-y-px">
                            <div className="mb-4">
                                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm bg-blue-50"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm bg-blue-50"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                    Remember me
                                </label>
                            </div>

                        </div>

                        <div className="flex items-center justify-end">
                            <Link to="/forgot-password" class="text-sm font-medium text-green-600 hover:text-green-500">
                                Forgot your password?
                            </Link>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </div>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <div>
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.536-6.033-5.696  c0-3.159,2.702-5.696,6.033-5.696c1.482,0,2.831,0.481,3.896,1.29l2.871-2.871C17.58,3.582,15.202,2.5,12.545,2.5  C6.985,2.5,2.5,7.199,2.5,12.755c0,5.556,4.485,10.255,10.045,10.255c5.344,0,9.75-3.921,9.75-9.605c0-0.916-0.106-1.703-0.279-2.348  H12.545z" fill="#DB4437" />
                                    <path d="M22.016,13.405c0.173,0.645,0.279,1.432,0.279,2.348c0,5.684-4.406,9.605-9.75,9.605  c-0.259,0-0.511-0.016-0.76-0.043l4.743-4.743C19.721,19.263,21.579,16.634,22.016,13.405z" fill="#34A853" />
                                    <path d="M16.519,20.572L11.776,15.83c-1.341,0.854-2.923,1.173-4.488,0.898l-3.957,3.957  C5.776,22.457,9.014,23.01,12.545,23.01C15.424,23.01,18.049,21.967,20.088,20.219l-3.569-3.569L16.519,20.572z" fill="#FBBC05" />
                                    <path d="M12.545,2.5c2.657,0,5.035,1.082,6.726,2.69l-2.871,2.871c-1.065-0.809-2.414-1.29-3.896-1.29  c-3.332,0-6.033,2.536-6.033,5.696c0,0.666,0.116,1.294,0.323,1.889L3.331,9.901C4.409,5.534,8.136,2.5,12.545,2.5z" fill="#4285F4" />
                                </svg>
                                Continue with Google
                            </button>
                        </div>
                    </form>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-medium text-green-600 hover:text-green-500">
                            Sign up here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
