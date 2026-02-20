
import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, X, Minimize2, ShoppingCart, User, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import ProductCard from './ProductCard';
import OrderCard from './OrderCard';
import { useAuth } from '../contexts/AuthContext';

// Use environment variable for API URL
// Fallback to localhost:5010 if not set (port of chatbot backend)
const API_URL = import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:5010/api/chat';

const ChatBot = ({ userId }) => {
    const { currentUser } = useAuth();
    // CRITICAL: Use Firebase UID (uid) for order tracking, NOT MongoDB _id
    // Orders in database are stored with Firebase UID
    const effectiveUserId = userId || currentUser?.uid || null;

    console.log('👤 ChatBot User Info:', {
        providedUserId: userId,
        firebaseUid: currentUser?.uid,
        mongoId: currentUser?._id,
        effectiveUserId: effectiveUserId
    });

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { type: 'bot', content: "Hi! 👋 I'm your FreshCart Assistant. Ask me about products, prices, or your order status!", contentType: 'text' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputText.trim()) return;

        const userMsg = { type: 'user', content: inputText, contentType: 'text' };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            console.log('🤖 Sending message to chatbot:', {
                message: userMsg.content,
                userId: effectiveUserId,
                userIdType: typeof effectiveUserId
            });

            const response = await axios.post(API_URL, {
                message: userMsg.content,
                userId: effectiveUserId
            });

            const data = response.data;

            // Map backend response to frontend format
            let contentType = 'text';
            let messageData = null;

            if (data.type === 'products' && data.products) {
                contentType = 'product_list';
                messageData = data.products.map(p => ({
                    name: p.name,
                    price: p.price,
                    image: p.image,
                    unit: p.unit || 'piece',
                    store: 'FreshCart'
                }));
            } else if (data.type === 'order' && data.order) {
                contentType = 'order_info';
                messageData = {
                    orderId: data.order.id,
                    status: data.order.status,
                    items: data.order.items,
                    total: data.order.total,
                    otp: data.order.otp
                };
            }

            const botMsg = {
                type: 'bot',
                content: data.message,
                contentType: contentType,
                data: messageData
            };

            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error("Chatbot Error:", error);
            setMessages(prev => [...prev, {
                type: 'bot',
                content: "Sorry, I'm having trouble connecting right now. 😓",
                contentType: 'text'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4 w-[380px] h-[600px] glass rounded-2xl flex flex-col overflow-hidden shadow-2xl border-white/40 bg-white"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-600 to-green-500 p-4 flex justify-between items-center text-white shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                                    <MessageSquare size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">FreshCart Assistant</h3>
                                    <div className="flex items-center gap-1.5 opacity-90">
                                        <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                                        <span className="text-xs font-medium">Online</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                                <Minimize2 size={18} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scrollbar-hide">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] ${msg.type === 'user' ? 'order-1' : 'order-2'}`}>
                                        {/* Text Bubble */}
                                        <div className={`p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.type === 'user'
                                            ? 'bg-green-600 text-white rounded-tr-none'
                                            : 'bg-white text-gray-700 rounded-tl-none border border-gray-100'
                                            }`}>
                                            {msg.type === 'bot' ? (
                                                <div className="prose prose-sm max-w-none">
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                                            strong: ({ children }) => <span className="font-bold text-green-700">{children}</span>,
                                                            ul: ({ children }) => <ul className="list-none space-y-1 my-1">{children}</ul>,
                                                            li: ({ children }) => <li className="flex items-start gap-1">{children}</li>,
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : (
                                                msg.content
                                            )}
                                        </div>

                                        {/* Rich Content Renderers */}
                                        {msg.contentType === 'product_list' && msg.data && (
                                            <div className="mt-2 space-y-2">
                                                {msg.data.map((prod, pIdx) => (
                                                    <ProductCard key={pIdx} data={prod} />
                                                ))}
                                            </div>
                                        )}

                                        {msg.contentType === 'order_info' && msg.data && (
                                            <div className="mt-2">
                                                <OrderCard data={msg.data} />
                                            </div>
                                        )}

                                        {msg.contentType === 'link' && msg.data && (
                                            <a href={msg.data.url} target="_blank" rel="noreferrer" className="mt-2 block bg-white border border-green-200 p-3 rounded-xl hover:bg-green-50 transition-colors group">
                                                <span className="text-green-700 font-medium group-hover:underline text-sm flex items-center gap-2">
                                                    {msg.data.text} ↗
                                                </span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1 items-center">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce delay-75"></span>
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce delay-150"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-100">
                            {/* Quick Actions (only show if no input) */}
                            {messages.length < 3 && !inputText && (
                                <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                                    <button onClick={() => setInputText('Price of Onion')} className="whitespace-nowrap px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-xs text-gray-600 rounded-full border border-gray-200 transition-colors">
                                        🧅 Price of Onion
                                    </button>
                                    <button onClick={() => setInputText('Where is my order?')} className="whitespace-nowrap px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-xs text-gray-600 rounded-full border border-gray-200 transition-colors">
                                        🚚 Track Order
                                    </button>
                                    <button onClick={() => setInputText('Help')} className="whitespace-nowrap px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-xs text-gray-600 rounded-full border border-gray-200 transition-colors">
                                        ❓ Help
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-full focus:ring-green-500 focus:border-green-500 block w-full p-2.5 px-4 outline-none transition-shadow"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputText.trim()}
                                    className="p-2.5 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Toggle Button */}
            {!isOpen && (
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center gap-2 group"
                >
                    <div className="relative">
                        <MessageSquare size={26} />
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    </div>
                    <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out font-medium whitespace-nowrap">
                        Chat with us
                    </span>
                </motion.button>
            )}
        </div>
    );
};

export default ChatBot;
