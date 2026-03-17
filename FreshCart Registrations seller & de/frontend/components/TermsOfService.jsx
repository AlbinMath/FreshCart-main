import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
                <Link to="/" className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
                <div className="prose prose-blue max-w-none text-gray-600 space-y-4">
                    <p>Last updated: December 06, 2025</p>
                    <p>This is a demo Terms of Service page for FreshCart.</p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using our platform, you agree to be bound by these Terms of Service and all applicable laws and regulations.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">2. User Accounts</h2>
                    <p>
                        You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">3. Contact</h2>
                    <p>
                        For any questions, contact us via LinkedIn: www.linkedin.com/in/albinmathew2002
                    </p>
                </div>
            </div>
        </div>
    );
}
