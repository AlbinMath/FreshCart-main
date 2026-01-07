import React from 'react';
import { Users, UserCheck, Clock, ShoppingBag } from 'lucide-react';

const DashboardOverview = () => {
    const [statsData, setStatsData] = React.useState({
        totalUsers: 0,
        customerUsers: 0,
        deliveryUsers: 0,
        sellerUsers: 0
    });

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/users/stats/count');
                if (response.ok) {
                    const data = await response.json();
                    setStatsData(data);
                }
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            }
        };
        fetchStats();
    }, []);

    const stats = [
        { title: 'Total Users', value: statsData.totalUsers, icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'Customers Users', value: statsData.customerUsers, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        { title: 'Delivary Users', value: statsData.deliveryUsers, icon: Clock, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'Sellers Users', value: statsData.sellerUsers, icon: ShoppingBag, color: 'text-green-600', bg: 'bg-green-100' },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className={`p-3 rounded-full ${stat.bg} ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                            <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Administrator Profile */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-800">Administrator Profile</h3>
                    <span className="bg-red-50 text-red-500 text-xs px-2 py-1 rounded-full font-medium">Read Only</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Name</label>
                        <p className="font-medium text-gray-900">Administrator</p>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Email</label>
                        <p className="font-medium text-gray-900">freshcart912@gmail.com</p>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Role</label>
                        <p className="font-medium text-gray-900">Administrator</p>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-500 mb-1">Administrator Level</label>
                        <p className="font-medium text-gray-900">Super</p>
                    </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-md">
                    <p className="text-sm text-yellow-800">
                        <span className="font-bold">Note:</span> Administrator profiles are read-only and cannot be edited for security reasons.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4">Recent Activity</h3>
                    {/* Placeholder */}
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4">Quick Actions</h3>
                    {/* Placeholder */}
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;
