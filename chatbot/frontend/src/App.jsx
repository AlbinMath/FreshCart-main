import ChatWidget from './components/ChatWidget';
import './App.css';

function App() {
    // In production, get userId from authentication context
    // For now, you can pass a test userId or null
    const userId = null; // Replace with actual user ID from auth

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
            {/* Demo Page Content */}
            <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-gray-800 mb-4">
                        FreshCart AI Assistant
                    </h1>
                    <p className="text-xl text-gray-600">
                        Your intelligent shopping companion for fresh products
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">🥬</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            Product Search
                        </h3>
                        <p className="text-gray-600 text-sm">
                            Find fresh vegetables, meat, fish, and dairy products instantly
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">📦</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            Order Tracking
                        </h3>
                        <p className="text-gray-600 text-sm">
                            Track your orders in real-time with delivery OTP
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">💬</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            24/7 Support
                        </h3>
                        <p className="text-gray-600 text-sm">
                            Get instant answers to all your FreshCart questions
                        </p>
                    </div>
                </div>

                <div className="mt-16 text-center">
                    <p className="text-gray-600 mb-4">
                        Click the chat button in the bottom right to get started! 👉
                    </p>
                    <div className="bg-white rounded-xl p-6 max-w-2xl mx-auto shadow-lg">
                        <h3 className="font-semibold text-gray-800 mb-3">Try asking:</h3>
                        <div className="flex flex-wrap gap-2 justify-center">
                            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm">
                                "Show me fresh vegetables"
                            </span>
                            <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm">
                                "Track my order"
                            </span>
                            <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm">
                                "Price of chicken"
                            </span>
                            <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm">
                                "How to become a seller?"
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Widget */}
            <ChatWidget userId={userId} />
        </div>
    );
}

export default App;
