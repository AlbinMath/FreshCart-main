import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Sellers = () => {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSellers();
    }, []);

    const fetchSellers = async () => {
        try {
            const res = await fetch('http://localhost:5003/api/admin/sellers');
            const data = await res.json();
            setSellers(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching sellers:', error);
            setLoading(false);
            toast.error('Failed to load sellers');
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Seller Management</h1>
                    <p className="text-gray-500 mt-1">Manage and monitor platform sellers</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                        <Filter size={18} />
                        Filter
                    </button>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                        Add Seller
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search sellers by name or email..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 font-medium text-gray-600">Business Name</th>
                                <th className="p-4 font-medium text-gray-600">Contact Info</th>
                                <th className="p-4 font-medium text-gray-600">Joined Date</th>
                                <th className="p-4 font-medium text-gray-600">Status</th>
                                <th className="p-4 font-medium text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">Loading sellers...</td>
                                </tr>
                            ) : sellers.length > 0 ? (
                                sellers.map(seller => (
                                    <tr key={seller._id} className="hover:bg-gray-50">
                                        <td className="p-4 font-semibold text-gray-900">{seller.businessName}</td>
                                        <td className="p-4">
                                            <div className="text-sm text-gray-900">{seller.contactEmail}</div>
                                            <div className="text-sm text-gray-500">{seller.contactPhone}</div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {new Date(seller.joinedAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${seller.status === 'Active' ? 'bg-green-100 text-green-700' :
                                                    seller.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {seller.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                                <button className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        <Users className="mx-auto mb-3 text-gray-400" size={32} />
                                        <p>No sellers registered yet.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Sellers;
