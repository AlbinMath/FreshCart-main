import React, { useState, useEffect } from 'react';
import { Check, Star, Shield, Zap, Clock, Truck, ShoppingBag, Gift, Heart, Plus, Edit2, Trash2, Eye, EyeOff, Crown } from 'lucide-react';
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import toast from 'react-hot-toast';

const PremiumDelivery = () => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentPlan, setCurrentPlan] = useState(null); // null for create, object for edit

    // Form State
    const [formData, setFormData] = useState({
        type: 'seller',
        name: '',
        price: '',
        duration: '',
        description: '',
        features: '', // Check server expects array, will convert
        color: 'blue',
        icon: 'Truck',
        recommended: false
    });

    const fetchPlans = async () => {
        try {
            const res = await fetch('http://localhost:5003/api/premium-plans');
            if (res.ok) {
                const data = await res.json();
                setPlans(data);
            } else {
                toast.error("Failed to fetch plans");
            }
        } catch (error) {
            console.error("Error fetching plans:", error);
            toast.error("Error fetching plans");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openCreateDialog = () => {
        setCurrentPlan(null);
        setFormData({
            type: 'seller',
            name: '',
            price: '',
            duration: '',
            description: '',
            features: '',
            color: 'blue',
            icon: 'Truck',
            recommended: false
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (plan) => {
        setCurrentPlan(plan);
        setFormData({
            ...plan,
            features: plan.features.join('\n') // Convert array to newline separated string for textarea
        });
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        try {
            // Prepare data
            const payload = {
                ...formData,
                features: formData.features.split('\n').filter(f => f.trim() !== '')
            };

            let res;
            if (currentPlan) {
                // Update
                res = await fetch(`http://localhost:5003/api/premium-plans/${currentPlan._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                // Create
                res = await fetch('http://localhost:5003/api/premium-plans', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (res.ok) {
                toast.success(currentPlan ? "Plan updated" : "Plan created");
                setIsDialogOpen(false);
                fetchPlans();
            } else {
                const errorData = await res.json();
                toast.error(errorData.msg || "Operation failed");
            }
        } catch (error) {
            console.error("Error saving plan:", error);
            toast.error("Error saving plan");
        }
    };

    const handleToggleVisibility = async (e, plan) => {
        e.stopPropagation(); // Prevent card click if we add that later
        try {
            const res = await fetch(`http://localhost:5003/api/premium-plans/${plan._id}/visibility`, {
                method: 'PATCH'
            });

            if (res.ok) {
                const updatedPlan = await res.json();
                toast.success(updatedPlan.isVisible ? "Plan is now visible" : "Plan hidden");
                fetchPlans(); // Refresh list
            } else {
                toast.error("Failed to update visibility");
            }
        } catch (error) {
            console.error("Error toggling visibility:", error);
            toast.error("Error toggling visibility");
        }
    };

    const getIcon = (iconName) => {
        const icons = { Check, Star, Shield, Zap, Clock, Truck, ShoppingBag, Gift, Heart, Crown };
        return icons[iconName] || Truck;
    };

    const PlanCard = ({ plan }) => {
        const Icon = getIcon(plan.icon);
        const isHidden = !plan.isVisible;

        return (
            <div
                className={`
                    relative flex flex-col bg-white rounded-2xl transition-all duration-300 overflow-hidden group border
                    ${plan.recommended
                        ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)] scale-[1.02] z-10'
                        : 'border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1'
                    }
                    ${isHidden ? 'opacity-60 grayscale' : ''}
                `}
            >
                {plan.recommended && (
                    <div className="absolute top-0 right-0 left-0 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold text-center py-1.5 uppercase tracking-wider shadow-sm flex items-center justify-center gap-1">
                        <Crown size={12} fill="currentColor" /> Most Popular
                    </div>
                )}

                {/* Admin Actions */}
                <div className="absolute top-8 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 bg-white/80 backdrop-blur-md rounded-lg p-1 shadow-sm border border-gray-100">
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600" onClick={() => openEditDialog(plan)}>
                        <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-gray-100 hover:text-gray-700"
                        onClick={(e) => handleToggleVisibility(e, plan)}
                        title={plan.isVisible ? "Hide Plan" : "Show Plan"}
                    >
                        {plan.isVisible ? (
                            <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                            <Eye className="h-3.5 w-3.5" />
                        )}
                    </Button>
                </div>

                <div className={`p-6 flex flex-col items-center text-center gap-4 ${plan.recommended ? 'pt-10' : ''}`}>
                    <div className={`
                        p-4 rounded-2xl transition-transform duration-300 group-hover:scale-110 shadow-sm
                        ${plan.recommended ? 'bg-yellow-50 text-yellow-600' : `bg-${plan.color}-50 text-${plan.color}-600`}
                    `}>
                        <Icon size={32} strokeWidth={1.5} />
                    </div>

                    <div>
                        <h3 className={`font-bold text-xl tracking-tight ${plan.recommended ? 'text-gray-900' : 'text-gray-700'}`}>
                            {plan.name} {!plan.isVisible && <span className="text-xs text-red-500 font-normal ml-1">(Hidden)</span>}
                        </h3>
                        <p className="text-sm text-gray-400 font-medium uppercase tracking-wide mt-1">{plan.duration}</p>
                    </div>

                    <div className="flex items-baseline justify-center gap-1 my-2 w-full">
                        <span className={`text-4xl font-extrabold tracking-tight ${plan.price === 'Free' ? 'text-green-600' : 'text-gray-900'}`}>
                            {plan.price}
                        </span>
                        {plan.price !== 'Free' && <span className="text-gray-400 text-sm font-medium">/mo</span>}
                    </div>

                    <p className="text-sm text-gray-500 min-h-[40px] leading-relaxed px-4">{plan.description}</p>
                </div>

                <div className="flex-1 p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col gap-4">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 text-center">What's Included</div>
                    <ul className="space-y-3 flex-1">
                        {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm text-gray-600 text-left group/item">
                                <div className={`mt-0.5 rounded-full p-0.5 ${plan.recommended ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 group-hover/item:text-green-500 group-hover/item:bg-green-50'} transition-colors`}>
                                    <Check className="h-3 w-3" strokeWidth={3} />
                                </div>
                                <span className="flex-1">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50/30 p-8 space-y-10">
            <div className="max-w-[1400px] mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-100 pb-8">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
                            <span className="text-gradient-gold">Premium</span> Delivery Plans
                        </h1>
                        <p className="text-gray-500 text-lg max-w-2xl">
                            Unlock exclusive benefits for your users. Manage subscription tiers for both sellers and customers from a single dashboard.
                        </p>
                    </div>
                    <Button onClick={openCreateDialog} className="bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-200 hover:shadow-xl transition-all h-12 px-6 rounded-xl">
                        <Plus className="mr-2 h-5 w-5" /> Add New Plan
                    </Button>
                </div>

                <Tabs defaultValue="seller" className="w-full space-y-8">
                    <div className="flex justify-center">
                        <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-white border border-gray-200 rounded-2xl shadow-sm h-14">
                            <TabsTrigger
                                value="seller"
                                className="rounded-xl text-base font-medium data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all h-full"
                            >
                                For Sellers
                            </TabsTrigger>
                            <TabsTrigger
                                value="customer"
                                className="rounded-xl text-base font-medium data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-md transition-all h-full"
                            >
                                For Customers
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="seller" className="focus:outline-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                            {plans.filter(p => p.type === 'seller').map((plan) => (
                                <PlanCard key={plan._id} plan={plan} />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="customer" className="focus:outline-none">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
                            {plans.filter(p => p.type === 'customer').map((plan) => (
                                <PlanCard key={plan._id} plan={plan} />
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl p-0 gap-0 overflow-hidden">
                    <DialogHeader className="p-6 bg-gray-50 border-b border-gray-100">
                        <DialogTitle className="text-xl font-bold">{currentPlan ? 'Edit Premium Plan' : 'Create New Plan'}</DialogTitle>
                        <DialogDescription className="text-gray-500">
                            {currentPlan ? 'Update the details below. Some fields are locked for security.' : 'Configure the new plan details exactly as you need.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="type" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(val) => handleSelectChange('type', val)}
                                    disabled={!!currentPlan}
                                >
                                    <SelectTrigger className="h-11 rounded-xl bg-gray-50 border-gray-200">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="seller">Seller</SelectItem>
                                        <SelectItem value="customer">Customer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Gold"
                                    disabled={!!currentPlan}
                                    className="h-11 rounded-xl bg-gray-50 border-gray-200"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="price" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</Label>
                                <Input
                                    id="price"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    placeholder="e.g. ₹499"
                                    disabled={currentPlan && currentPlan.price === 'Free'}
                                    className="h-11 rounded-xl bg-gray-50 border-gray-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</Label>
                                <Input
                                    id="duration"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 1 Month"
                                    disabled={!!currentPlan}
                                    className="h-11 rounded-xl bg-gray-50 border-gray-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</Label>
                            <Input
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Brief marketing tagline for this plan"
                                className="h-11 rounded-xl bg-gray-50 border-gray-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="features" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Features (One per line)</Label>
                            <Textarea
                                id="features"
                                name="features"
                                value={formData.features}
                                onChange={handleInputChange}
                                placeholder="Free Delivery&#10;Priority Support&#10;Exclusive Deals"
                                className="min-h-[120px] rounded-xl bg-gray-50 border-gray-200 resize-none p-4"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="color" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Theme Color</Label>
                                <Select
                                    value={formData.color}
                                    onValueChange={(val) => handleSelectChange('color', val)}
                                >
                                    <SelectTrigger className="h-11 rounded-xl bg-gray-50 border-gray-200">
                                        <SelectValue placeholder="Select color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gray">Gray (Utility)</SelectItem>
                                        <SelectItem value="blue">Blue (Standard)</SelectItem>
                                        <SelectItem value="green">Green (Growth)</SelectItem>
                                        <SelectItem value="purple">Purple (Premium)</SelectItem>
                                        <SelectItem value="orange">Orange (Elite)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="icon" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Icon</Label>
                                <Select
                                    value={formData.icon}
                                    onValueChange={(val) => handleSelectChange('icon', val)}
                                >
                                    <SelectTrigger className="h-11 rounded-xl bg-gray-50 border-gray-200">
                                        <SelectValue placeholder="Select icon" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Truck">Truck</SelectItem>
                                        <SelectItem value="Zap">Zap (Lightning)</SelectItem>
                                        <SelectItem value="Star">Star</SelectItem>
                                        <SelectItem value="Shield">Shield</SelectItem>
                                        <SelectItem value="Clock">Clock</SelectItem>
                                        <SelectItem value="ShoppingBag">Shopping Bag</SelectItem>
                                        <SelectItem value="Gift">Gift</SelectItem>
                                        <SelectItem value="Heart">Heart</SelectItem>
                                        <SelectItem value="Crown">Crown</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <input
                                type="checkbox"
                                id="recommended"
                                name="recommended"
                                checked={formData.recommended}
                                onChange={handleInputChange}
                                className="h-5 w-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                            />
                            <Label htmlFor="recommended" className="font-medium text-gray-700 cursor-pointer">Mark as "Most Popular" Plan</Label>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-gray-50 border-t border-gray-100 gap-2">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-11 px-6 rounded-xl border-gray-200 hover:bg-white hover:text-gray-900">Cancel</Button>
                        <Button onClick={handleSave} className="h-11 px-6 rounded-xl bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-200">Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PremiumDelivery;
