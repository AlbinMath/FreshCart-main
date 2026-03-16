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
        { type: 'bot', content: "Hi! 👋 I'm your FreshCart AI Assistant. I can help you find products, track orders, or even analyze account performance!", contentType: 'text' }
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
            } else if (data.type === 'add_to_cart' && data.product) {
                contentType = 'add_to_cart';
                messageData = data.product;
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
                        className="mb-4 w-[400px] h-[650px] glass rounded-2xl flex flex-col overflow-hidden shadow-2xl border-white/40 bg-white"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-700 to-green-500 p-4 flex justify-between items-center text-white shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm border border-white/30">
                                    <MessageSquare size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight">FreshCart AI Hub</h3>
                                    <div className="flex items-center gap-1.5 opacity-90">
                                        <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse shadow-[0_0_8px_rgba(134,239,172,0.8)]"></span>
                                        <span className="text-xs font-medium tracking-wide Uppercase">Active Intelligence</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-hide">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[90%] ${msg.type === 'user' ? 'order-1' : 'order-2'}`}>
                                        {/* Text Bubble */}
                                        <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.type === 'user'
                                            ? 'bg-green-700 text-white rounded-tr-none'
                                            : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                                            }`}>
                                            {msg.type === 'bot' ? (
                                                <div className="prose prose-sm max-w-none">
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                                            strong: ({ children }) => <span className="font-bold text-green-700">{children}</span>,
                                                            ul: ({ children }) => <ul className="list-none space-y-1.5 my-1.5">{children}</ul>,
                                                            li: ({ children }) => <li className="flex items-start gap-1"><span>•</span>{children}</li>,
                                                            h3: ({ children }) => <h3 className="text-green-800 font-bold mt-2 mb-1">{children}</h3>,
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
                                            <div className="mt-3 grid gap-3">
                                                {msg.data.map((prod, pIdx) => (
                                                    <ProductCard key={pIdx} data={prod} />
                                                ))}
                                            </div>
                                        )}

                                        {msg.contentType === 'add_to_cart' && msg.data && (
                                            <div className="mt-3 bg-white border border-green-100 rounded-2xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <img src={msg.data.image} alt={msg.data.name} className="w-16 h-16 rounded-xl object-cover border border-slate-100" />
                                                    <div>
                                                        <h4 className="font-bold text-slate-800">{msg.data.name}</h4>
                                                        <p className="text-sm font-semibold text-green-600">₹{msg.data.price}</p>
                                                    </div>
                                                </div>
                                                <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-95">
                                                    <ShoppingCart size={18} />
                                                    Add to Cart
                                                </button>
                                            </div>
                                        )}

                                        {msg.contentType === 'order_info' && msg.data && (
                                            <div className="mt-3">
                                                <OrderCard data={msg.data} />
                                            </div>
                                        )}

                                        {msg.contentType === 'link' && msg.data && (
                                            <a href={msg.data.url} target="_blank" rel="noreferrer" className="mt-3 block bg-white border border-green-200 p-4 rounded-2xl hover:bg-green-50 transition-all group shadow-sm">
                                                <span className="text-green-700 font-bold group-hover:underline text-sm flex items-center justify-between">
                                                    {msg.data.text}
                                                    <span className="text-green-400 group-hover:translate-x-1 transition-transform">→</span>
                                                </span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex gap-1.5 items-center">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
                            {/* Proactive Quick Actions */}
                            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
                                <button onClick={() => setInputText('How is my store performance?')} className="flex-none flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-green-50 text-[11px] font-bold text-slate-600 hover:text-green-700 rounded-xl border border-slate-200 hover:border-green-200 transition-all">
                                    📈 Store Analysis
                                </button>
                                <button onClick={() => setInputText('What are the Customer Plans?')} className="flex-none flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-purple-50 text-[11px] font-bold text-slate-600 hover:text-purple-700 rounded-xl border border-slate-200 hover:border-purple-200 transition-all">
                                    💎 Premium Plans
                                </button>
                                <button onClick={() => setInputText('Track my order')} className="flex-none flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-blue-50 text-[11px] font-bold text-slate-600 hover:text-blue-700 rounded-xl border border-slate-200 hover:border-blue-200 transition-all">
                                    🚚 Track Order
                                </button>
                                <button onClick={() => setInputText('Who am I?')} className="flex-none flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-orange-50 text-[11px] font-bold text-slate-600 hover:text-orange-700 rounded-xl border border-slate-200 hover:border-orange-200 transition-all">
                                    👤 My Profile
                                </button>
                                <button onClick={() => setInputText('Help')} className="flex-none flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-gray-100 text-[11px] font-bold text-slate-600 rounded-xl border border-slate-200 transition-all">
                                    ❓ Help
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Ask AI anything..."
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 block p-3 px-4 outline-none transition-all placeholder:text-slate-400"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">
                                        <HelpCircle size={16} />
                                    </div>
                                </div>
                                <button
                                    onClick={handleSend}
                                    disabled={!inputText.trim()}
                                    className="p-3 bg-green-700 text-white rounded-2xl hover:bg-green-800 disabled:opacity-40 disabled:grayscale transition-all shadow-lg shadow-green-900/10 active:scale-95"
                                >
                                    <Send size={20} />
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
                    data-chatbot-toggle="true"
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
