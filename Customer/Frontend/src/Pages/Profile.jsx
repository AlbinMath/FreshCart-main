import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Profile() {
    const { currentUser, verifyEmail } = useAuth();

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">

                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900">Please info Log in to view profile</h2>
                        <Link to="/login" className="mt-4 inline-block text-green-600 hover:text-green-500">Go to Login</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">

            <div className="flex-grow container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="bg-green-600 py-6 px-6 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="bg-white p-2 rounded-full">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{currentUser.name || currentUser.displayName}</h2>
                                <p className="text-green-100">{currentUser.email}</p>
                            </div>
                        </div>
                        <Link to="/" className="text-white hover:text-green-100 font-medium">Home</Link>
                    </div>
                    <div className="p-6 space-y-6">
                        {!currentUser.emailVerified && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-yellow-700">
                                            Your email is not verified.
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await verifyEmail(currentUser);
                                                        alert('Verification email sent!');
                                                    } catch (error) {
                                                        alert('Error sending verification email: ' + error.message);
                                                    }
                                                }}
                                                className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-2"
                                            >
                                                Resend Verification Email
                                            </button>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Account Details</h3>
                            <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{currentUser.name || currentUser.displayName || 'N/A'}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{currentUser.email}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{currentUser.phoneNumber || 'N/A'}</dd>
                                </div>



                            </dl>
                            <div className="mt-6 border-t pt-4">
                                <Link to="/change-password" className="text-green-600 hover:text-green-500 font-medium text-sm flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                    Change Password
                                </Link>
                                <Link to="/report-issue" className="text-red-500 hover:text-red-600 font-medium text-sm flex items-center mt-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Report an Issue
                                </Link>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <h3 className="text-lg font-medium text-gray-900">Default Address</h3>
                                <Link to="/add-address" className="text-sm text-green-600 hover:text-green-500 font-medium">
                                    + Add Address
                                </Link>
                            </div>
                            <div className="mt-4">
                                {currentUser.addresses && currentUser.addresses.find(addr => addr.isDefault) ? (
                                    (() => {
                                        const defaultAddr = currentUser.addresses.find(addr => addr.isDefault);
                                        return (
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <p className="font-medium text-gray-900">{currentUser.name || currentUser.displayName}</p>
                                                <p className="text-gray-600">{defaultAddr.street}</p>
                                                <p className="text-gray-600">{defaultAddr.city}, {defaultAddr.state} {defaultAddr.zipCode}</p>
                                                <p className="text-gray-600">{defaultAddr.country}</p>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                                        <p className="text-gray-500 text-sm">No default address selected.</p>
                                        <Link to="/add-address" className="mt-2 inline-block text-green-600 hover:text-green-500 text-sm font-medium">
                                            Add a new address
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
