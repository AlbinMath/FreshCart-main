import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import { Button } from '@/ui/button';
import {
    Users,
    DollarSign,
    ShoppingBag,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Reports = () => {
    // Mock Data
    const summaryData = [
        { title: "Total Revenue", value: "₹0.00", change: "0%", icon: DollarSign, positive: true },
        { title: "Orders", value: "0", change: "0%", icon: ShoppingBag, positive: true },
        { title: "Active Customers", value: "0", change: "0%", icon: Users, positive: true },
        { title: "Returns", value: "0", change: "0%", icon: TrendingUp, positive: false }
    ];

    const chartData = [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
                <div className="flex items-center space-x-2">
                    <Button>Download PDF</Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {summaryData.map((item, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {item.title}
                            </CardTitle>
                            <item.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{item.value}</div>
                            <p className="text-xs text-muted-foreground flex items-center mt-1">
                                {item.positive ? (
                                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                                ) : (
                                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                                )}
                                <span className={item.positive ? "text-green-500" : "text-red-500"}>
                                    {item.change}
                                </span>
                                <span className="ml-1">from last month</span>
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Main Chart Area */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                        <CardDescription>
                            Monthly revenue overview for the current year.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `₹${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="total" fill="#16a34a" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Sales / Top Products */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Top Selling Products</CardTitle>
                        <CardDescription>
                            Your best performing items this month.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {/* Products list will be populated from API */}
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No data available.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Reports;
