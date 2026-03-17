import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
                <Link to="/" className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
                <div className="prose prose-blue max-w-none text-gray-600 space-y-4">
                    <p>Last updated: December 06, 2025</p>
                    <p>This is a demo Privacy Policy page for FreshCart.</p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">1. Information We Collect</h2>
                    <p>
                        We collect information that you provide directly to us when you register as a seller or delivery agent,
                        including your name, email address, phone number, and business details.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">2. How We Use Your Information</h2>
                    <p>
                        We use the information we collect to facilitate the delivery of fresh products, communicate with you,
                        and ensure the safety and security of our platform.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">3. Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at albinmathew2026@mca.ajce.in.
                    </p>
                </div>
            </div>
        </div>
    );
}
