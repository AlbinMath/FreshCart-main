import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Fingerprint, CheckCircle, Shield, User, Mail, Phone, MapPin, Truck } from 'lucide-react';

const Settings = () => {
    const [agent, setAgent] = useState(null);
    const [loading, setLoading] = useState(true);

    // Get Agent Info locally or fetch
    const localAgent = JSON.parse(localStorage.getItem('agent') || '{}');
    const agentId = localAgent.id;

    useEffect(() => {
        const fetchProfile = async () => {
            if (!agentId) return;
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/profile/${agentId}`);
                setAgent(res.data);

                // Auto-generate ID if missing
                if (!res.data.uniqueId) {
                    generateUniqueId(agentId);
                }
            } catch (err) {
                console.error("Error fetching profile", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [agentId]);

    const generateUniqueId = async (id) => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/generate-id/${id}`);
            if (res.data.uniqueId) {
                setAgent(prev => ({ ...prev, uniqueId: res.data.uniqueId }));
            }
        } catch (err) {
            console.error("Error generating ID", err);
        }
    };

    if (loading) return <div className="p-8">Loading settings...</div>;
    if (!agent) return <div className="p-8">Agent not found. Please log in again.</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Account Settings</h1>

            {/* Identity Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        <Fingerprint size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Agent Identity</h2>
                        <p className="text-sm text-gray-500">Manage your unique identification credentials.</p>
                    </div>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-green-100 p-3 rounded-full text-green-600">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <div className="text-green-800 font-medium">Delivery Agent Unique ID Active</div>
                            <div className="text-2xl font-mono font-bold text-gray-800 tracking-wider mt-1">
                                {agent.uniqueId || 'Generating...'}
                            </div>
                        </div>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-full border border-green-100 shadow-sm text-xs font-bold text-green-600 flex items-center gap-2">
                        <Shield size={14} />
                        Verified & Locked
                    </div>
                </div>
            </div>
            <div className="text-center text-xs text-gray-400 pt-4">
                FreshCart Delivery Partner • Account Verified
            </div>
        </div>
    );
};

export default Settings;
