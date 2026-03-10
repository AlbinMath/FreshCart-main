import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const TaxManagement = () => {
    const [taxes, setTaxes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        region: '',
        taxRate: '',
        taxType: 'GST',
        isActive: true
    });

    useEffect(() => {
        fetchTaxes();
    }, []);

    const fetchTaxes = async () => {
        try {
            const res = await fetch('http://localhost:5003/api/admin/tax');
            const data = await res.json();
            setTaxes(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching taxes:', error);
            setLoading(false);
            toast.error('Failed to load tax rules');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:5003/api/admin/tax', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setShowForm(false);
                fetchTaxes();
                setFormData({ region: '', taxRate: '', taxType: 'GST', isActive: true });
                toast.success('Tax rule created');
            } else {
                toast.error('Failed to create tax rule');
            }
        } catch (error) {
            console.error('Error creating tax rule:', error);
            toast.error('Error creating tax rule');
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tax Management</h1>
                    <p className="text-gray-500 mt-1">Configure and manage regional tax rules</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={18} />
                    New Tax Rule
                </button>
            </div>

            {showForm && (
                <div className="mb-8 bg-indigo-50 p-6 rounded-lg border border-indigo-100">
                    <h3 className="text-lg font-semibold mb-4">Add Tax Rule</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Region/State/Country</label>
                            <input
                                type="text"
                                placeholder="e.g. Maharashtra, India, California"
                                className="w-full p-2 border rounded-lg"
                                value={formData.region}
                                onChange={e => setFormData({ ...formData, region: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                            <input
                                type="number"
                                placeholder="e.g. 18"
                                className="w-full p-2 border rounded-lg"
                                value={formData.taxRate}
                                onChange={e => setFormData({ ...formData, taxRate: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Type</label>
                            <select
                                className="w-full p-2 border rounded-lg"
                                value={formData.taxType}
                                onChange={e => setFormData({ ...formData, taxType: e.target.value })}
                            >
                                <option value="GST">GST</option>
                                <option value="VAT">VAT</option>
                                <option value="Sales Tax">Sales Tax</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 mt-6">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer font-medium">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 text-indigo-600 rounded"
                                />
                                Rule is Active
                            </label>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 mt-4 border-t pt-4">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium"
                            >
                                Save Rule
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 font-medium text-gray-600">Region</th>
                                <th className="p-4 font-medium text-gray-600">Tax Type</th>
                                <th className="p-4 font-medium text-gray-600">Rate</th>
                                <th className="p-4 font-medium text-gray-600">Status</th>
                                <th className="p-4 font-medium text-gray-600">Last Updated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">Loading tax rules...</td>
                                </tr>
                            ) : taxes.length > 0 ? (
                                taxes.map(tax => (
                                    <tr key={tax._id} className="hover:bg-gray-50">
                                        <td className="p-4 font-semibold text-gray-900">{tax.region}</td>
                                        <td className="p-4 text-sm text-gray-500">{tax.taxType}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-lg text-indigo-700">{tax.taxRate}%</div>
                                        </td>
                                        <td className="p-4">
                                            {tax.isActive ? (
                                                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full w-fit text-xs font-medium">
                                                    <CheckCircle size={14} /> Active
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full w-fit text-xs font-medium">
                                                    <XCircle size={14} /> Inactive
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {new Date(tax.lastUpdated).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        <DollarSign className="mx-auto mb-3 text-gray-400" size={32} />
                                        <p>No tax rules defined.</p>
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

export default TaxManagement;
