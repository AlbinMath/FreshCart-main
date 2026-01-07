import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import chatbotIcon from './chatbot_icon.png';

const ChatBot = () => {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hi! How can I help you today?", sender: 'bot' }
    ]);
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, isOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const userMessageText = inputText;
        // Add user message
        const newMessage = { id: Date.now(), text: userMessageText, sender: 'user' };
        setMessages(prev => [...prev, newMessage]);
        setInputText("");
        setIsTyping(true);

        try {
            // Use the Node.js backend route
            // apiService.BASE_URL is likely http://localhost:5001/api or similar
            // We can construct the URL directly or import apiService to avoid hardcoding issues if BASE_URL changes
            const response = await fetch('http://localhost:5001/api/chatbot/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessageText,
                    userId: currentUser?.uid // Pass user ID for order lookup
                }),
            });

            const data = await response.json();

            // Bot response delay for realism if instant
            setTimeout(() => {
                const botResponse = {
                    id: Date.now() + 1,
                    text: data.response || "Sorry, I didn't get that.",
                    sender: 'bot',
                    products: data.products // Store products if available
                };
                setMessages(prev => [...prev, botResponse]);
                setIsTyping(false);
            }, 600);

        } catch (error) {
            console.error("Chatbot error:", error);
            setIsTyping(false);
            const errorMsg = {
                id: Date.now() + 2,
                text: "Sorry, I'm having trouble connecting to the server.",
                sender: 'bot'
            };
            setMessages(prev => [...prev, errorMsg]);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            <div
                className={`pointer-events-auto bg-white w-80 sm:w-96 rounded-2xl shadow-2xl border border-gray-100 mb-4 flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4 pointer-events-none hidden'
                    }`}
                style={{ maxHeight: '600px', height: '80vh' }}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-500 p-4 text-white flex justify-between items-center shadow-md">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <img src={chatbotIcon} alt="Bot" className="h-10 w-10 rounded-full border-2 border-white/30 bg-white" />
                            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-300 border-2 border-green-600 rounded-full"></span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">FreshCart <span className="text-green-100 text-sm font-normal">AI</span></h3>
                            <p className="text-xs text-green-50 opacity-90">Always here to help</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors focus:outline-none"
                        aria-label="Close chat"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
                    <div className="text-center text-xs text-gray-400 my-2">Today</div>

                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start items-end gap-2'}`}
                        >
                            {msg.sender === 'bot' && (
                                <img src={chatbotIcon} alt="Bot" className="h-8 w-8 rounded-full border border-gray-200 bg-white mb-1" />
                            )}

                            <div className={`max-w-[80%] p-3.5 text-sm shadow-sm relative group transition-all duration-200 hover:shadow-md ${msg.sender === 'user'
                                ? 'bg-green-600 text-white rounded-2xl rounded-tr-sm'
                                : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'
                                }`}
                            >
                                {msg.text}
                                <div className={`text-[10px] mt-1 opacity-70 ${msg.sender === 'user' ? 'text-green-100 text-right' : 'text-gray-400'}`}>
                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                {msg.products && (
                                    <div className="mt-3 flex gap-2 overflow-x-auto pb-2 snap-x">
                                        {msg.products.map(prod => (
                                            <div key={prod._id} className="min-w-[120px] w-[120px] bg-white border rounded-lg p-2 shadow-sm snap-start">
                                                <div className="h-20 w-full bg-gray-100 rounded mb-2 overflow-hidden">
                                                    {prod.images && prod.images[0] ? (
                                                        <img src={prod.images[0]} alt={prod.productName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Img</div>
                                                    )}
                                                </div>
                                                <p className="text-xs font-bold text-gray-800 truncate">{prod.productName}</p>
                                                <p className="text-xs text-green-600 font-medium">₹{prod.sellingPrice}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="flex justify-start items-end gap-2 scroll-mt-4">
                            <img src={chatbotIcon} alt="Bot" className="h-8 w-8 rounded-full border border-gray-200 bg-white mb-1" />
                            <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-sm shadow-sm">
                                <div className="flex gap-1.5">
                                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
                    <div className="flex gap-2 items-center bg-gray-100 p-1.5 rounded-full border border-transparent focus-within:border-green-300 focus-within:ring-2 focus-within:ring-green-100 transition-all">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 bg-transparent px-4 py-2 text-sm focus:outline-none text-gray-700 placeholder-gray-500"
                        />
                        <button
                            type="submit"
                            disabled={!inputText.trim()}
                            className={`p-2.5 rounded-full transition-all duration-200 shadow-sm ${inputText.trim()
                                ? 'bg-green-600 text-white hover:bg-green-700 hover:scale-105 active:scale-95'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                        </button>
                    </div>
                    <div className="text-center mt-2">
                        <span className="text-[10px] text-gray-400">Powered by FreshCart AI</span>
                    </div>
                </form>
            </div>

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`pointer-events-auto bg-green-600 hover:bg-green-700 text-white p-0 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 ring-offset-2 flex items-center justify-center overflow-hidden ${isOpen ? 'h-12 w-12 rotate-90 ' : 'h-16 w-16 rotate-0'
                    }`}
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <div className="relative h-full w-full p-1">
                        <img
                            src={chatbotIcon}
                            alt="Chat"
                            className="h-full w-full rounded-full object-cover animate-pulse-slow"
                        />
                        <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 border-2 border-green-600 rounded-full animate-ping"></span>
                    </div>
                )}
            </button>
        </div>
    );
};

export default ChatBot;
