import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Phone, Mail, MapPin, Calendar, CreditCard, Truck, Hash, Star } from 'lucide-react';

const Profile = () => {
    // Retrieve agent name from local storage
    const agentData = JSON.parse(localStorage.getItem('agent') || '{}');
    const [stats, setStats] = useState({ averageRating: "0.0" });

    useEffect(() => {
        if (agentData.id) {
            axios.get(`${import.meta.env.VITE_API_URL}/stats/${agentData.id}`)
                .then(res => setStats(res.data))
                .catch(err => console.error(err));
        }
    }, [agentData.id]);

    // Helper to render a detail row
    const DetailRow = ({ icon: Icon, label, value }) => (
        <div className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                <Icon size={20} />
            </div>
            <div>
                <div className="text-sm text-gray-500 font-medium mb-1">{label}</div>
                <div className="text-gray-900 font-semibold">{value || 'N/A'}</div>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
                <p className="text-gray-500">Manage your personal information and delivery details.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Column - Main Info */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center">
                        <div className="w-24 h-24 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center text-green-600">
                            <User size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{agentData.fullName}</h3>
                        <p className="text-sm text-gray-500 mb-2">Delivery Partner</p>
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full capitalize
                            ${agentData.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {agentData.status || 'Active'}
                        </span>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Performance Overview</h4>
                        <div className="p-4 bg-purple-50 rounded-xl text-center border border-purple-100">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                <Star size={20} className="fill-purple-400 text-purple-400" />
                                <span className="text-3xl font-bold text-purple-900">{stats.averageRating || "0.0"}</span>
                            </div>
                            <p className="text-xs text-purple-600 font-medium">Customer Satisfaction Rating</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-4 border-b pb-2">Contact Info</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <Phone size={16} className="text-gray-400" />
                                <span className="text-gray-700">{agentData.contactNumber}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Mail size={16} className="text-gray-400" />
                                <span className="text-gray-700 break-all">{agentData.email}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Details Grid */}
                <div className="md:col-span-2 space-y-6">

                    {/* Personal & Address */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <h4 className="font-bold text-gray-800">Personal Details</h4>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DetailRow icon={Calendar} label="Date of Birth" value={agentData.dateOfBirth?.split('T')[0]} />
                            <DetailRow icon={MapPin} label="Residential Address" value={agentData.residentialAddress} />
                            <DetailRow icon={Hash} label="Pin Code" value={agentData.pinCode} />
                        </div>
                    </div>

                    {/* Vehicle & Bank */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <h4 className="font-bold text-gray-800">Vehicle & Bank Details</h4>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DetailRow icon={Truck} label="Vehicle Registration" value={agentData.vehicleRegistrationNumber} />
                            <DetailRow icon={CreditCard} label="Bank Account" value={agentData.bankAccountNumber} />
                            <DetailRow icon={Hash} label="IFSC Code" value={agentData.ifscCode} />
                            <DetailRow icon={CreditCard} label="UPI ID" value={agentData.upiId} />
                            <DetailRow icon={User} label="Account Holder" value={agentData.accountHolderName} />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Profile;
