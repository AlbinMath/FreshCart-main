import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function CookiePolicy() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
                <Link to="/" className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Cookie Policy</h1>
                <div className="prose prose-blue max-w-none text-gray-600 space-y-4">
                    <p>Last updated: December 06, 2025</p>
                    <p>This is a demo Cookie Policy page for FreshCart.</p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">1. What Are Cookies</h2>
                    <p>
                        Cookies are small pieces of text sent to your web browser by a website you visit. A cookie file is stored in your web browser and allows the Service or a third-party to recognize you.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">2. How We Use Cookies</h2>
                    <p>
                        We use cookies to enable certain functions of the Service, to provide analytics, to store your preferences, and to enable advertisements delivery.
                    </p>
                </div>
            </div>
        </div>
    );
}
