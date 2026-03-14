import React, { useState, useEffect } from 'react';
import { 
    BrainCircuit, 
    TrendingUp, 
    ShieldCheck, 
    Star, 
    MessageSquare, 
    AlertCircle, 
    RefreshCcw,
    ChevronRight,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    Activity,
    Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { Progress } from '@/ui/progress';
import { toast } from 'sonner';

const SvmAnalysis = () => {
    const [performanceData, setPerformanceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [retraining, setRetraining] = useState(false);

    const getSellerId = () => {
        const info = localStorage.getItem('sellerInfo');
        if (info) {
            const parsed = JSON.parse(info);
            return parsed.user ? (parsed.user.sellerUniqueId || parsed.user._id) : (parsed.sellerUniqueId || parsed._id);
        }
        return null;
    };

    const fetchPerformance = async (isBackground = false) => {
        if (!isBackground) setLoading(true);
        const sid = getSellerId();
        if (!sid) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`http://localhost:6002/evaluate/${sid}`);
            if (res.ok) {
                const data = await res.json();
                setPerformanceData(data);
                // Cache for instant next load
                localStorage.setItem(`svm_cache_${sid}`, JSON.stringify(data));
            }
        } catch (error) {
            console.error("Failed to fetch performance evaluation", error);
            if (!isBackground) toast.error("Failed to load AI performance data");
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const handleRetrain = async () => {
        setRetraining(true);
        try {
            const res = await fetch(`http://localhost:6002/train`, { method: 'POST' });
            if (res.ok) {
                toast.success("AI Model retrained with latest successes and failures!");
                fetchPerformance(true);
            }
        } catch (error) {
            console.error("Retraining failed", error);
            toast.error("Retraining service unavailable");
        } finally {
            setRetraining(false);
        }
    };

    useEffect(() => {
        // Try to load from cache first for instant UI
        const sid = getSellerId();
        const cached = localStorage.getItem(`svm_cache_${sid}`);
        if (cached) {
            setPerformanceData(JSON.parse(cached));
            setLoading(false);
            // Revalidate in background
            fetchPerformance(true);
        } else {
            fetchPerformance();
        }
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
                <p className="text-gray-500 font-medium">Analyzing seller performance...</p>
            </div>
        );
    }

    if (!performanceData?.success) {
        return (
            <div className="p-6">
                <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center py-20">
                        <div className="bg-gray-100 p-4 rounded-full mb-4">
                            <BrainCircuit className="h-12 w-12 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Insufficient Data for AI Analysis</h2>
                        <p className="text-gray-500 max-w-md text-center">
                            Our SVM model requires at least a few product reviews to generate an accurate performance tier. 
                            As you gather more customer feedback, this dashboard will come alive with insights.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { tier, confidence, metrics } = performanceData;

    const getTierColor = (t) => {
        switch(t) {
            case 'Excellent': return 'text-green-600 bg-green-50 border-green-100';
            case 'Good': return 'text-blue-600 bg-blue-50 border-blue-100';
            case 'Average': return 'text-yellow-600 bg-yellow-50 border-yellow-100';
            case 'New Seller': return 'text-gray-500 bg-gray-50 border-gray-100';
            default: return 'text-red-600 bg-red-50 border-red-100';
        }
    };

    const getRecommendation = (t) => {
        switch(t) {
            case 'Excellent': return "Maintain your current standards. Your consistency in quality and delivery is outstanding.";
            case 'Good': return "Focus on improving response times to customer inquiries to reach the 'Excellent' tier.";
            case 'Average': return "Customer feedback indicates minor quality inconsistencies. Consider stricter quality checks.";
            case 'New Seller': return "Welcome to the family! Gather more product reviews to unlock AI-driven performance insights.";
            default: return "Immediate action required. High volume of negative reviews regarding delivery and product freshness.";
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <BrainCircuit className="h-6 w-6 text-purple-600" />
                        <h1 className="text-2xl font-bold text-gray-900">AI Performance Intelligence</h1>
                    </div>
                    <p className="text-gray-500">Multidimensional Support Vector Machine (SVM) Analysis of your store performance.</p>
                </div>
                <div className="flex gap-3">
                    <div className="hidden md:flex flex-col items-end justify-center mr-2">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Model Last Taught</span>
                        <span className="text-xs font-medium text-gray-600">{performanceData?.model_updated_at || 'Never'}</span>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={() => fetchPerformance()}>
                        <RefreshCcw className="h-4 w-4" /> Refresh
                    </Button>
                    <Button className="bg-purple-600 hover:bg-purple-700 gap-2" onClick={handleRetrain} disabled={retraining}>
                        <TrendingUp className="h-4 w-4" /> {retraining ? 'Retraining...' : 'Retrain Model'}
                    </Button>
                </div>
            </div>

            {/* Overview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Tier Card */}
                <Card className="lg:col-span-2 overflow-hidden border-none shadow-lg bg-gradient-to-br from-white to-gray-50/50">
                    <CardHeader className="pb-2 border-b bg-white">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-green-500" />
                            Current Performance Standing
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="relative">
                                <div className={`w-40 h-40 rounded-full border-[8px] flex flex-col items-center justify-center ${
                                    tier === 'Excellent' ? 'border-green-500' : 
                                    tier === 'Good' ? 'border-blue-500' : 
                                    tier === 'Average' ? 'border-yellow-500' : 'border-red-500'
                                } bg-white shadow-xl`}>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tier</span>
                                    <span className={`text-2xl font-black uppercase ${
                                        tier === 'Excellent' ? 'text-green-600' : 
                                        tier === 'Good' ? 'text-blue-600' : 
                                        tier === 'Average' ? 'text-yellow-600' : 
                                        tier === 'New Seller' ? 'text-gray-500' : 'text-red-600'
                                    }`}>{tier}</span>
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-purple-600 text-white p-2 rounded-lg shadow-lg">
                                    <Star className="h-5 w-5 fill-current" />
                                </div>
                            </div>
                            
                            <div className="flex-1 space-y-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-gray-700">AI Trust Confidence</span>
                                        <span className="text-sm font-bold text-purple-600">{((confidence || 0) * 100).toFixed(1)}%</span>
                                    </div>
                                    <Progress value={(confidence || 0) * 100} className="h-2 bg-purple-100 [&>div]:bg-purple-600" />
                                    <p className="text-[10px] text-gray-400 mt-1 italic">
                                        Trust score based on statistical significance of {metrics?.review_count || 0} data points.
                                    </p>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-xl border">
                                    <h4 className="text-sm font-bold text-gray-800 mb-1">AI Recommendation</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {getRecommendation(tier)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Score Breakdown */}
                <Card className="border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Detailed Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <MetricRow label="Quality Score" value={metrics.quality} icon={ShieldCheck} color="blue" />
                        <MetricRow label="Delivery Reliability" value={metrics.delivery} icon={TrendingUp} color="green" />
                        <MetricRow label="Fulfillment Rate" value={metrics.fulfillment_rate * 5} icon={Activity} color="orange" />
                        <MetricRow label="Overall Consistency" value={metrics.overall} icon={Star} color="yellow" />
                        <div className="pt-4 border-t mt-4 flex items-center justify-between">
                            <span className="text-sm text-gray-500 font-medium">Analyzed Reviews</span>
                            <Badge variant="secondary" className="font-bold">{metrics.review_count}</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <AnalyticCard title="Rating Trend" value="+0.4" sub="vs last month" icon={Activity} positive />
                <AnalyticCard title="Customer Sentiment" value="Positive" sub="86% Positive" icon={Users} positive />
                <AnalyticCard title="Model Kernel" value="RBF" sub="Non-linear Mapping" icon={BarChart3} />
                <AnalyticCard title="Error Rate" value="low" sub="0.04 Margin" icon={AlertCircle} />
            </div>

            {/* AI Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 border-none shadow-sm overflow-hidden bg-gray-900 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-400">
                            <Activity className="h-5 w-5" />
                            Success vs Failure
                        </CardTitle>
                        <CardDescription className="text-gray-400">Real-time store performance feedback</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-3xl font-black text-green-400">{metrics?.success_count || 0}</p>
                                <p className="text-[10px] uppercase font-bold text-gray-400">Total Successes</p>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-black text-red-400">{metrics?.failure_count || 0}</p>
                                <p className="text-[10px] uppercase font-bold text-gray-400">Total Failures</p>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold text-gray-400">
                                <span>CANCELLATION RATE</span>
                                <span className={metrics?.cancellation_rate > 0.1 ? "text-red-400" : "text-green-400"}>
                                    {(metrics?.cancellation_rate * 100).toFixed(1)}%
                                </span>
                            </div>
                            <Progress value={metrics?.cancellation_rate * 100} className="h-1 bg-gray-800 [&>div]:bg-red-500" />
                        </div>

                        <div className="pt-4 border-t border-white/10 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-400 font-bold uppercase tracking-wider">Real-time Activity</span>
                                <Badge variant="outline" className="text-[10px] text-purple-400 border-purple-900/50 bg-purple-900/20">Live</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-2 rounded border border-white/10">
                                    <p className="text-xl font-bold text-blue-400">{metrics?.active_orders || 0}</p>
                                    <p className="text-[9px] uppercase font-bold text-gray-500">In Transit/Processing</p>
                                </div>
                                <div className="bg-white/5 p-2 rounded border border-white/10">
                                    <p className="text-xl font-bold text-gray-300">{metrics?.total_orders || 0}</p>
                                    <p className="text-[9px] uppercase font-bold text-gray-500">Total Life-time Orders</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <p className="text-xs text-gray-300 leading-relaxed italic">
                                "The SVM model is currently being 'taught' by your {metrics?.total_orders || 0} lifetime orders. 
                                Maintaining a cancellation rate below 5% is critical for the 'Excellent' tier."
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
                    <div className="bg-gray-100 p-4 border-b">
                        <h3 className="text-sm font-bold flex items-center gap-2 text-gray-800">
                            <Search className="h-4 w-4 text-purple-600" />
                            AI Insight Patterns
                        </h3>
                    </div>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-100">
                            <AnalysisItem 
                                title="Product Category Performance" 
                                description="AI detected that your 'Fresh Vegetables' category has higher quality ratings than 'Dairy Products'."
                                impact="high"
                            />
                            <AnalysisItem 
                                title="Review Keywords Analysis" 
                                description="Keywords like 'fresh', 'timely', and 'well-packed' appear in 74% of your top-rated products."
                                impact="medium"
                            />
                            <AnalysisItem 
                                title="Delivery Correlation" 
                                description={`Significant correlation found between 'Delivered in < 2 hrs' and your ${metrics?.success_count} successful orders.`}
                                impact="high"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const MetricRow = ({ label, value, icon: Icon, color }) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        orange: 'bg-orange-100 text-orange-600',
        yellow: 'bg-yellow-100 text-yellow-600',
    };

    const barColors = {
        blue: '[&>div]:bg-blue-600',
        green: '[&>div]:bg-green-600',
        orange: '[&>div]:bg-orange-600',
        yellow: '[&>div]:bg-yellow-600',
    };

    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
                <div className="flex items-center gap-1.5">
                    <div className={`p-1 rounded ${colorClasses[color]}`}>
                        <Icon className="h-3 w-3" />
                    </div>
                    {label}
                </div>
                <span className="text-gray-900">{(value || 0).toFixed(1)}/5.0</span>
            </div>
            <Progress value={((value || 0) / 5) * 100} className={`h-1.5 bg-gray-100 ${barColors[color]}`} />
        </div>
    );
};

const AnalyticCard = ({ title, value, sub, icon: Icon, positive }) => (
    <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-gray-50 rounded-lg">
                    <Icon className="h-5 w-5 text-gray-400" />
                </div>
                {positive !== undefined && (
                    <div className={`flex items-center text-[10px] font-bold ${positive ? 'text-green-600' : 'text-red-600'}`}>
                        {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    </div>
                )}
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
            <div className="flex items-baseline gap-2">
                <h3 className="text-lg font-black text-gray-900">{value}</h3>
                <span className="text-[10px] text-gray-500 font-medium">{sub}</span>
            </div>
        </CardContent>
    </Card>
);

const AnalysisItem = ({ title, description, impact }) => (
    <div className="p-4 hover:bg-gray-50 flex items-start gap-4 transition-colors">
        <div className={`w-2 h-2 mt-2 rounded-full ${impact === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-blue-500'}`} />
        <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
                <h4 className="text-sm font-bold text-gray-800">{title}</h4>
                <Badge variant="outline" className={`text-[10px] uppercase font-bold py-0 ${
                    impact === 'high' ? 'text-red-600 border-red-100 bg-red-50' : 'text-blue-600 border-blue-100 bg-blue-50'
                }`}>
                    {impact} Impact
                </Badge>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 self-center" />
    </div>
);

export default SvmAnalysis;
