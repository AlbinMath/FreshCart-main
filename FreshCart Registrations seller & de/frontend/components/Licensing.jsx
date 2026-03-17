import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Licensing() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
                <Link to="/" className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Licensing</h1>
                <div className="prose prose-blue max-w-none text-gray-600 space-y-4">
                    <p>This is a demo Licensing page for FreshCart.</p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">Intellectual Property</h2>
                    <p>
                        The service and its original content, features, and functionality are and will remain the exclusive property of FreshCart and its licensors.
                    </p>

                    <h2 className="text-xl font-semibold text-gray-800 mt-6">Open Source Components</h2>
                    <p>
                        We may use open source software in our platform. Each open source component is subject to its own license terms.
                    </p>
                </div>
            </div>
        </div>
    );
}
