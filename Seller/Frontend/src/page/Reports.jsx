import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { Progress } from '@/ui/progress';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import {
    Users,
    DollarSign,
    ShoppingBag,
    ArrowUpRight,
    ArrowDownRight,
    TrendingUp,
    Package,
    Star,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    TrendingDown,
    FileText,
    RefreshCcw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import ProductDetailsDialog from './products/ProductDetailsDialog';

const Reports = () => {
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timePeriod, setTimePeriod] = useState('month'); // 'day', 'month', 'year'
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    
    // Withdrawal states
    const [withdrawRequests, setWithdrawRequests] = useState([]);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
    const [requestLoading, setRequestLoading] = useState(false);
    const [performanceData, setPerformanceData] = useState(null);
    const [isTraining, setIsTraining] = useState(false);

    const fetchPerformance = async (sellerId) => {
        try {
            const res = await fetch(`http://localhost:6002/evaluate/${sellerId}`);
            if (res.ok) {
                const data = await res.json();
                setPerformanceData(data);
            }
        } catch (error) {
            console.error("Failed to fetch performance evaluation", error);
        }
    };

    const handleRetrain = async () => {
        setIsTraining(true);
        try {
            const res = await fetch(`http://localhost:6002/train`, { method: 'POST' });
            if (res.ok) {
                toast.success("SVM model retrained with latest data!");
                const info = JSON.parse(localStorage.getItem('sellerInfo'));
                const seller = info?.user || info;
                fetchPerformance(seller.sellerUniqueId || seller._id);
            }
        } catch (error) {
            toast.error("Failed to retrain model");
        } finally {
            setIsTraining(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const info = JSON.parse(localStorage.getItem('sellerInfo'));
                const seller = info?.user || info;

                if (!seller) return;

                // Fetch orders
                const sellerId = seller._id;
                if (sellerId) {
                    const ordersRes = await fetch(`${import.meta.env.VITE_API_URL}/orders/seller/${sellerId}`);
                    if (ordersRes.ok) {
                        const ordersData = await ordersRes.json();
                        setOrders(ordersData);
                    }
                }

                // Fetch products
                const uniqueId = seller.sellerUniqueId;
                if (uniqueId) {
                    const productsRes = await fetch(`${import.meta.env.VITE_API_URL}/products/seller/${uniqueId}`);
                    if (productsRes.ok) {
                        const productsData = await productsRes.json();
                        setProducts(productsData);
                    }
                }

                // Fetch withdrawals
                if (sellerId) {
                    const withdrawRes = await fetch(`${import.meta.env.VITE_API_URL}/withdrawals/seller/${sellerId}`);
                    if (withdrawRes.ok) {
                        const withdrawData = await withdrawRes.json();
                        if (withdrawData.success) {
                            setWithdrawRequests(withdrawData.requests);
                        }
                    }
                }

                // Fetch Performance
                const perfId = seller.sellerUniqueId || seller._id;
                if (perfId) {
                    fetchPerformance(perfId);
                }
            } catch (e) {
                console.error("Error loading analytics data", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    // Calculate analytics
    const totalRevenue = orders.reduce((sum, order) => sum + (order.items?.reduce((s, i) => s + (i.price * i.quantity), 0) || 0), 0);
    const totalOrders = orders.length;

    // Get unique customers
    const uniqueCustomers = new Set(orders.map(o => o.userId)).size;

    // Calculate returns/cancelled orders
    const cancelledOrders = orders.filter(o => o.status === 'Cancelled').length;

    // Time-based revenue data for chart
    const getChartData = () => {
        const dataMap = {};

        orders.forEach(order => {
            const date = new Date(order.createdAt);
            let key;

            if (timePeriod === 'day') {
                // Last 30 days
                key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } else if (timePeriod === 'month') {
                // Last 12 months
                key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            } else {
                // Yearly
                key = date.getFullYear().toString();
            }

            if (!dataMap[key]) {
                dataMap[key] = 0;
            }
            dataMap[key] += order.items?.reduce((s, i) => s + (i.price * i.quantity), 0) || 0;
        });

        return Object.entries(dataMap)
            .map(([name, total]) => ({ name, total }))
            .slice(-15); // Show last 15 data points
    };

    const chartData = getChartData();

    // Top selling products (based on order items)
    const productSales = {};
    orders.forEach(order => {
        order.items?.forEach(item => {
            if (!productSales[item.productId]) {
                productSales[item.productId] = {
                    productId: item.productId,
                    name: item.productName,
                    sales: 0,
                    revenue: 0,
                    image: item.image
                };
            }
            productSales[item.productId].sales += item.quantity || 1;
            productSales[item.productId].revenue += (item.price || 0) * (item.quantity || 1);
        });
    });

    const topProducts = Object.values(productSales)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

    const handleProductClick = (productId) => {
        const product = products.find(p => p._id === productId);
        if (product) {
            setSelectedProduct(product);
            setIsDetailsOpen(true);
        }
    };

    const handleWithdrawalRequest = async () => {
        if (!withdrawAmount || isNaN(withdrawAmount) || parseFloat(withdrawAmount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        if (parseFloat(withdrawAmount) > withdrawableBalance) {
            toast.error("Amount exceeds withdrawable balance");
            return;
        }

        setRequestLoading(true);
        try {
            const info = JSON.parse(localStorage.getItem('sellerInfo'));
            const seller = info?.user || info;
            
            const res = await fetch(`${import.meta.env.VITE_API_URL}/withdrawals/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sellerId: seller._id,
                    amount: parseFloat(withdrawAmount)
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Withdrawal request submitted successfully!");
                setWithdrawAmount('');
                setShowWithdrawDialog(false);
                // Refresh requests
                const withdrawRes = await fetch(`${import.meta.env.VITE_API_URL}/withdrawals/seller/${seller._id}`);
                if (withdrawRes.ok) {
                    const withdrawData = await withdrawRes.json();
                    if (withdrawData.success) setWithdrawRequests(withdrawData.requests);
                }
            } else {
                toast.error(data.message || "Failed to submit request");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred. Please try again.");
        } finally {
            setRequestLoading(false);
        }
    };

    const deliveredRevenue = orders.filter(o => o.status === 'Delivered').reduce((sum, order) => sum + (order.items?.reduce((s, i) => s + (i.price * i.quantity), 0) || 0), 0);
    const approvedWithdrawals = withdrawRequests.filter(r => r.status === 'Approved' || r.status === 'Pending').reduce((sum, r) => sum + r.amount, 0);
    const withdrawableBalance = Math.max(0, deliveredRevenue - approvedWithdrawals);

    const handleDownloadPDF = () => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.text("Seller Reports & Analytics", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        // Summary Section
        doc.setFontSize(14);
        doc.text("Summary", 14, 45);

        const summaryBody = [
            ["Total Revenue", `Rs. ${totalRevenue.toFixed(2)}`],
            ["Total Orders", totalOrders.toString()],
            ["Active Customers", uniqueCustomers.toString()],
            ["Cancelled Orders", cancelledOrders.toString()]
        ];

        autoTable(doc, {
            startY: 50,
            head: [['Metric', 'Value']],
            body: summaryBody,
            theme: 'striped',
            headStyles: { fillColor: [22, 163, 74] } // Green-600
        });

        // Revenue Overview Table
        let finalY = doc.lastAutoTable.finalY + 15;
        doc.text("Revenue Overview", 14, finalY);

        const revenueBody = chartData.map(item => [item.name, `Rs. ${item.total.toFixed(2)}`]);

        autoTable(doc, {
            startY: finalY + 5,
            head: [['Date/Period', 'Revenue']],
            body: revenueBody,
            theme: 'striped',
            headStyles: { fillColor: [22, 163, 74] }
        });

        // Top Selling Products Table
        finalY = doc.lastAutoTable.finalY + 15;

        // Check if we need a new page
        if (finalY > 250) {
            doc.addPage();
            finalY = 20;
        }

        doc.text("Top Selling Products", 14, finalY);

        const productsBody = topProducts.map(p => [p.name, p.sales.toString(), `Rs. ${p.revenue.toFixed(2)}`]);

        autoTable(doc, {
            startY: finalY + 5,
            head: [['Product Name', 'Units Sold', 'Total Revenue']],
            body: productsBody,
            theme: 'striped',
            headStyles: { fillColor: [22, 163, 74] }
        });

        // Product Statistics
        finalY = doc.lastAutoTable.finalY + 15;
        if (finalY > 250) {
            doc.addPage();
            finalY = 20;
        }

        doc.text("Product Inventory Status", 14, finalY);

        const inventoryBody = [
            ["Total Products", products.length.toString()],
            ["Active", products.filter(p => p.status === 'active').length.toString()],
            ["Inactive", products.filter(p => p.status === 'inactive').length.toString()],
            ["Draft", products.filter(p => p.status === 'draft').length.toString()],
            ["Low Stock", products.filter(p => p.stockQuantity <= 10 && p.stockQuantity > 0).length.toString()],
            ["Out of Stock", products.filter(p => p.stockQuantity === 0).length.toString()]
        ];

        autoTable(doc, {
            startY: finalY + 5,
            head: [['Status', 'Count']],
            body: inventoryBody,
            theme: 'striped',
            headStyles: { fillColor: [22, 163, 74] }
        });

        // AI Performance Evaluation
        if (performanceData?.success) {
            finalY = doc.lastAutoTable.finalY + 15;
            if (finalY > 250) {
                doc.addPage();
                finalY = 20;
            }

            doc.text("AI Performance Analysis (SVM)", 14, finalY);

            const perfBody = [
                ["Performance Tier", performanceData.tier],
                ["Confidence Score", `${((performanceData.confidence || 0) * 100).toFixed(1)}%`],
                ["Overall Rating", `${(performanceData.metrics?.overall || 0).toFixed(2)} / 5.0`],
                ["Quality Score", `${(performanceData.metrics?.quality || 0).toFixed(2)} / 5.0`],
                ["Delivery Score", `${(performanceData.metrics?.delivery || 0).toFixed(2)} / 5.0`],
                ["Total Reviews Analyzed", (performanceData.metrics?.review_count || 0).toString()]
            ];

            autoTable(doc, {
                startY: finalY + 5,
                head: [['Metric', 'Evaluation']],
                body: perfBody,
                theme: 'striped',
                headStyles: { fillColor: [22, 163, 74] }
            });
        }

        // Save the PDF
        doc.save(`seller_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const summaryData = [
        {
            title: "Total Revenue",
            value: `₹${totalRevenue.toFixed(2)}`,
            change: "+12.5%",
            icon: DollarSign,
            positive: true
        },
        {
            title: "Orders",
            value: totalOrders.toString(),
            change: `+${orders.filter(o => new Date(o.createdAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}`,
            icon: ShoppingBag,
            positive: true
        },
        {
            title: "Active Customers",
            value: uniqueCustomers.toString(),
            change: "+8.2%",
            icon: Users,
            positive: true
        },
        {
            title: "Cancelled Orders",
            value: cancelledOrders.toString(),
            change: `${cancelledOrders > 0 ? '-' : ''}${((cancelledOrders / totalOrders) * 100).toFixed(1)}%`,
            icon: TrendingUp,
            positive: cancelledOrders === 0
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
                <div className="flex items-center space-x-4">
                    {performanceData?.success && (
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-green-100 cursor-help" title={`AI Confidence: ${(performanceData.confidence * 100).toFixed(0)}%`}>
                            <TrendingUp className={`h-4 w-4 ${
                                performanceData.tier === 'Excellent' ? 'text-green-600' : 
                                performanceData.tier === 'Good' ? 'text-blue-600' : 
                                performanceData.tier === 'Average' ? 'text-yellow-600' : 
                                performanceData.tier === 'New Seller' ? 'text-gray-400' : 'text-red-600'
                            }`} />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">AI Tier</span>
                                <span className={`text-[11px] font-bold uppercase leading-tight ${
                                    performanceData.tier === 'Excellent' ? 'text-green-700' : 
                                    performanceData.tier === 'Good' ? 'text-blue-700' : 
                                    performanceData.tier === 'Average' ? 'text-yellow-700' : 
                                    performanceData.tier === 'New Seller' ? 'text-gray-500' : 'text-red-700'
                                }`}>
                                    {performanceData.tier}
                                </span>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center space-x-2">
                        <Button variant="outline">Last 30 Days</Button>
                        <Button onClick={handleDownloadPDF}>
                            <FileText className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                    </div>
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
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Revenue Overview</CardTitle>
                                <CardDescription>
                                    {timePeriod === 'day' ? 'Daily' : timePeriod === 'month' ? 'Monthly' : 'Yearly'} revenue breakdown for your store.
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={timePeriod === 'day' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setTimePeriod('day')}
                                    className={timePeriod === 'day' ? 'bg-green-600 hover:bg-green-700' : ''}
                                >
                                    <Clock className="h-4 w-4 mr-1" />
                                    Day
                                </Button>
                                <Button
                                    variant={timePeriod === 'month' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setTimePeriod('month')}
                                    className={timePeriod === 'month' ? 'bg-green-600 hover:bg-green-700' : ''}
                                >
                                    <Calendar className="h-4 w-4 mr-1" />
                                    Month
                                </Button>
                                <Button
                                    variant={timePeriod === 'year' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setTimePeriod('year')}
                                    className={timePeriod === 'year' ? 'bg-green-600 hover:bg-green-700' : ''}
                                >
                                    <TrendingUp className="h-4 w-4 mr-1" />
                                    Year
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            {chartData.length > 0 ? (
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
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    <p>No revenue data available</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Products */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Top Selling Products</CardTitle>
                        <CardDescription>
                            Your best performing items this month.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topProducts.length > 0 ? (
                                topProducts.map((product, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => handleProductClick(product.productId)}
                                    >
                                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                            {product.image ? (
                                                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <Package className="h-5 w-5 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate hover:text-green-600 transition-colors">{product.name}</p>
                                            <p className="text-xs text-gray-500">{product.sales} units sold</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-green-600">₹{product.revenue.toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    No sales data available.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Analytics */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Product Performance</CardTitle>
                        <CardDescription>Comprehensive product status breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium">Total Products</span>
                                </div>
                                <span className="text-lg font-bold text-blue-600">{products.length}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium">Active Products</span>
                                </div>
                                <span className="text-lg font-bold text-green-600">
                                    {products.filter(p => p.status === 'active').length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-gray-600" />
                                    <span className="text-sm font-medium">Inactive Products</span>
                                </div>
                                <span className="text-lg font-bold text-gray-600">
                                    {products.filter(p => p.status === 'inactive').length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-medium">Draft Products</span>
                                </div>
                                <span className="text-lg font-bold text-purple-600">
                                    {products.filter(p => p.status === 'draft').length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                                <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-red-600" />
                                    <span className="text-sm font-medium">Forced Inactive</span>
                                </div>
                                <span className="text-lg font-bold text-red-600">
                                    {products.filter(p => p.status === 'forced-inactive').length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                                    <span className="text-sm font-medium">Low Stock Items</span>
                                </div>
                                <span className="text-lg font-bold text-yellow-600">
                                    {products.filter(p => p.stockQuantity <= 10 && p.stockQuantity > 0).length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-orange-600" />
                                    <span className="text-sm font-medium">Out of Stock</span>
                                </div>
                                <span className="text-lg font-bold text-orange-600">
                                    {products.filter(p => p.stockQuantity === 0).length}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Order Statistics</CardTitle>
                        <CardDescription>Complete breakdown by order status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium">Placed</span>
                                </div>
                                <span className="text-lg font-bold text-blue-600">
                                    {orders.filter(o => o.status === 'Placed').length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-orange-600" />
                                    <span className="text-sm font-medium">Processing</span>
                                </div>
                                <span className="text-lg font-bold text-orange-600">
                                    {orders.filter(o => o.status === 'Processing').length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-medium">Shipped</span>
                                </div>
                                <span className="text-lg font-bold text-purple-600">
                                    {orders.filter(o => o.status === 'Shipped').length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm font-medium">Delivered</span>
                                </div>
                                <span className="text-lg font-bold text-green-600">
                                    {orders.filter(o => o.status === 'Delivered').length}
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                                <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-red-600" />
                                    <span className="text-sm font-medium">Cancelled</span>
                                </div>
                                <span className="text-lg font-bold text-red-600">
                                    {orders.filter(o => o.status === 'Cancelled').length}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* AI Performance Analysis Section */}
            <Card className="border-green-100 bg-green-50/20">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            AI Performance Analysis (SVM)
                        </CardTitle>
                        <CardDescription>Support Vector Machine based evaluation of your store's service quality</CardDescription>
                    </div>
                    <Button 
                        onClick={handleRetrain} 
                        disabled={isTraining}
                        variant="outline"
                        className="bg-white"
                    >
                        <RefreshCcw className={`h-4 w-4 mr-2 ${isTraining ? 'animate-spin' : ''}`} />
                        {isTraining ? 'Retraining...' : 'Retrain AI Model'}
                    </Button>
                </CardHeader>
                <CardContent>
                    {performanceData?.success ? (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-sm border text-center">
                                <p className="text-sm font-medium text-gray-500 mb-2">Performance Tier</p>
                                <Badge className={`text-lg py-1 px-4 mb-2 ${
                                    performanceData.tier === 'Excellent' ? 'bg-green-600' : 
                                    performanceData.tier === 'Good' ? 'bg-blue-600' : 
                                    performanceData.tier === 'Average' ? 'bg-yellow-600' : 
                                    performanceData.tier === 'New Seller' ? 'bg-gray-400' : 'bg-red-600'
                                }`}>
                                    {performanceData.tier}
                                </Badge>
                                <p className="text-[10px] text-gray-400">Confidence: {((performanceData.confidence || 0) * 100).toFixed(1)}%</p>
                            </div>

                            <div className="space-y-4 col-span-1 md:col-span-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-white rounded-lg border">
                                        <p className="text-xs text-gray-500 mb-1">Overall Rating</p>
                                        <p className="text-xl font-bold text-gray-800">{(performanceData.metrics?.overall || 0).toFixed(2)}/5.0</p>
                                        <Progress value={((performanceData.metrics?.overall || 0) / 5) * 100} className="h-1 mt-2 bg-gray-100 [&>div]:bg-green-500" />
                                    </div>
                                    <div className="p-4 bg-white rounded-lg border">
                                        <p className="text-xs text-gray-500 mb-1">Quality Score</p>
                                        <p className="text-xl font-bold text-gray-800">{(performanceData.metrics?.quality || 0).toFixed(2)}/5.0</p>
                                        <Progress value={((performanceData.metrics?.quality || 0) / 5) * 100} className="h-1 mt-2 bg-gray-100 [&>div]:bg-blue-500" />
                                    </div>
                                    <div className="p-4 bg-white rounded-lg border">
                                        <p className="text-xs text-gray-500 mb-1">Delivery Score</p>
                                        <p className="text-xl font-bold text-gray-800">{(performanceData.metrics?.delivery || 0).toFixed(2)}/5.0</p>
                                        <Progress value={((performanceData.metrics?.delivery || 0) / 5) * 100} className="h-1 mt-2 bg-gray-100 [&>div]:bg-orange-500" />
                                    </div>
                                </div>
                                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-blue-900">Analysis Basis</p>
                                        <p className="text-xs text-blue-700">Calculated from {performanceData.metrics?.review_count} unique customer reviews across your catalog.</p>
                                    </div>
                                    <Badge variant="outline" className="bg-white text-blue-700 border-blue-200">
                                        SVM RBF Kernel
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                             <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                             <p className="text-gray-500">No performance data available for analysis yet.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Withdrawal Management</CardTitle>
                            <CardDescription>Request funds from your settled earnings (Delivered orders only)</CardDescription>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground font-medium">Withdrawable Balance</p>
                            <p className="text-2xl font-bold text-green-600">₹{withdrawableBalance.toFixed(2)}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-100">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-green-800">Ready for Withdrawal</p>
                                <p className="text-xs text-green-600">Settled earnings after excluding pending/shipped orders.</p>
                            </div>
                            <Button 
                                onClick={() => setShowWithdrawDialog(true)}
                                disabled={withdrawableBalance <= 0}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                Request Payout
                            </Button>
                        </div>

                        {/* Recent Withdrawal Requests */}
                        <div>
                            <h4 className="text-sm font-bold mb-3 uppercase tracking-wider text-gray-500">Recent Requests</h4>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">Amount</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                                            <th className="px-4 py-3 text-left font-medium text-gray-500">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {withdrawRequests.length > 0 ? (
                                            withdrawRequests.slice(0, 5).map((req, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">{new Date(req.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 font-bold text-gray-900">₹{req.amount.toFixed(2)}</td>
                                                    <td className="px-4 py-3">
                                                        <Badge className={
                                                            req.status === 'Approved' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-none' : 
                                                            req.status === 'Pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-none' : 
                                                            'bg-red-100 text-red-700 hover:bg-red-100 border-none'
                                                        }>
                                                            {req.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-500">
                                                        {req.transactionId ? `Ref: ${req.transactionId}` : req.adminNote || 'Processing...'}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="px-4 py-8 text-center text-gray-400">No withdrawal requests found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Withdrawal Dialog */}
            {showWithdrawDialog && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="w-full max-w-md shadow-2xl">
                        <CardHeader>
                            <CardTitle>Request Payout</CardTitle>
                            <CardDescription>Funds will be transferred to your registered bank account.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Desired Amount (₹)</label>
                                <input 
                                    type="number" 
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    placeholder="e.g. 500.00"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    max={withdrawableBalance}
                                />
                                <p className="text-[10px] text-gray-500">Max available: ₹{withdrawableBalance.toFixed(2)}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                                <p className="font-bold text-gray-700">Payment Destination:</p>
                                <p>Bank Transfer / UPI (Stored details)</p>
                            </div>
                        </CardContent>
                        <div className="p-6 pt-0 flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => setShowWithdrawDialog(false)}>Cancel</Button>
                            <Button 
                                className="flex-1 bg-green-600 hover:bg-green-700" 
                                onClick={handleWithdrawalRequest}
                                disabled={requestLoading || !withdrawAmount || parseFloat(withdrawAmount) > withdrawableBalance}
                            >
                                {requestLoading ? 'Submitting...' : 'Submit Request'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            <ProductDetailsDialog
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                product={selectedProduct}
                performanceData={performanceData}
            />
        </div>
    );
};

export default Reports;
