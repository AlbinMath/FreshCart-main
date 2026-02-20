import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
    const location = useLocation();
    const isHomePage = location.pathname === '/';

    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <Link to="/admin-login" className="flex items-center gap-2 mb-4 w-fit hover:opacity-80 transition">
                            <div className="bg-green-500 p-2 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                            </div>
                            <span className="text-xl text-white">Freshkart</span>
                        </Link>
                        <p className="text-gray-400 mb-4">
                            Delivering fresh, quality products directly to your doorstep.
                            Join our platform as a seller or delivery partner today.
                        </p>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-white mb-4">Legal</h3>
                        <ul className="space-y-2">
                            <li><a href="https://fresh-cart-seller-registrations-m7e.vercel.app/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-green-500 transition">Privacy Policy</a></li>
                            <li><a href="https://fresh-cart-seller-registrations-m7e.vercel.app/terms-of-service" target="_blank" rel="noopener noreferrer" className="hover:text-green-500 transition">Terms of Service</a></li>
                            <li><a href="https://fresh-cart-seller-registrations-m7e.vercel.app/licensing" target="_blank" rel="noopener noreferrer" className="hover:text-green-500 transition">Licensing</a></li>
                            <li><a href="https://fresh-cart-seller-registrations-m7e.vercel.app/cookie-policy" target="_blank" rel="noopener noreferrer" className="hover:text-green-500 transition">Cookie Policy</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white mb-4">Contact</h3>
                        <ul className="space-y-4 text-gray-400">
                            <li className="flex items-start gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-500 mt-1 flex-shrink-0"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                <div>
                                    <span className="block text-sm text-gray-500 mb-1">Email</span>
                                    <a href="mailto:albinmathew2026@mca.ajce.in" className="hover:text-green-500 transition break-all">
                                        albinmathew2026@mca.ajce.in
                                    </a>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-green-500 mt-1 flex-shrink-0"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
                                <div>
                                    <span className="block text-sm text-gray-500 mb-1">LinkedIn</span>
                                    <a href="https://www.linkedin.com/in/albinmathew2002" target="_blank" rel="noopener noreferrer" className="hover:text-green-500 transition break-all">
                                        www.linkedin.com/in/albinmathew2002
                                    </a>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <span className="block text-sm text-gray-500 mb-1">Support</span>
                                    <Link to="/report-issue" className="hover:text-green-500 transition">
                                        Report an Issue
                                    </Link>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
                    <p>&copy; 2025 FreshCart. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
