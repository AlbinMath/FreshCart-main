import React, { useState } from 'react';
import { Search, Filter, CheckCircle, XCircle, DollarSign, Clock } from 'lucide-react';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Payment Requests</h1>
                    <p className="text-gray-500">Manage seller payment requests and transactions</p>
                </div>
                {/* Summary Cards */}
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <div className="bg-white p-3 rounded-xl border shadow-sm flex items-center gap-3 pr-6 hover:shadow-md transition-shadow flex-1 md:flex-none">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Pending</p>
                            <p className="font-bold text-lg text-gray-800">$0.00</p>
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border shadow-sm flex items-center gap-3 pr-6 hover:shadow-md transition-shadow flex-1 md:flex-none">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">Paid</p>
                            <p className="font-bold text-lg text-gray-800">$0.00</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between transition-shadow hover:shadow-lg">
                <div className="flex flex-col md:flex-row items-center gap-4 flex-1 w-full">
                    <div className="relative flex-1 w-full md:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by transaction ID, seller..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter size={20} className="text-gray-400" />
                        <select
                            className="w-full md:w-auto border rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Transaction ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Seller</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Method</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {payments.length > 0 ? (
                                payments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors duration-150">
                                        {/* Row content would go here */}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                                <DollarSign className="text-gray-300" size={32} />
                                            </div>
                                            <p className="text-lg font-medium text-gray-900">No payment requests</p>
                                            <p className="text-sm text-gray-500 max-w-sm mt-1">Payment requests from sellers will appear here. No pending actions.</p>
                                        </div>
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

export default Payments;
