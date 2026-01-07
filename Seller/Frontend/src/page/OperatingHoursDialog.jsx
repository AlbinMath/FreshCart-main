import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/ui/dialog";
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Switch } from '@/ui/switch';
import { Label } from '@/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { Clock, Loader2 } from 'lucide-react';
// Assuming we might not have a complex Calendar component, will use standard date inputs for now.

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const OperatingHoursDialog = ({ open, onOpenChange, initialData, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('hours');

    // Hours State
    const [hours, setHours] = useState([]);

    // Leave State
    const [leave, setLeave] = useState({
        isActive: false,
        startDate: '',
        endDate: '',
        reason: ''
    });

    useEffect(() => {
        if (open && initialData) {
            // Initialize Hours
            if (initialData.operatingHours && Array.isArray(initialData.operatingHours) && initialData.operatingHours.length > 0) {
                // Merge with DAYS to ensure all days are present
                const mergedHours = DAYS.map(day => {
                    const existing = initialData.operatingHours.find(h => h.day === day);
                    return existing ? { ...existing } : { day, open: '09:00', close: '20:00', isClosed: false };
                });
                setHours(mergedHours);
            } else {
                // Default setup
                setHours(DAYS.map(day => ({ day, open: '09:00', close: '20:00', isClosed: false })));
            }

            // Initialize Leave
            if (initialData.storeLeave) {
                setLeave({
                    isActive: initialData.storeLeave.isActive || false,
                    startDate: initialData.storeLeave.startDate || '',
                    endDate: initialData.storeLeave.endDate || '',
                    reason: initialData.storeLeave.reason || ''
                });
            }
        }
    }, [open, initialData]);

    const handleHourChange = (index, field, value) => {
        const newHours = [...hours];
        newHours[index][field] = value;
        setHours(newHours);
    };

    const handleLeaveChange = (field, value) => {
        setLeave(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave({ operatingHours: hours, storeLeave: leave });
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Store Availability</DialogTitle>
                    <DialogDescription>Manage your weekly operating hours and scheduled leaves.</DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg mb-2 mx-4 mt-4 w-[calc(100%-2rem)]">
                        <TabsTrigger value="hours" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">Operating Hours</TabsTrigger>
                        <TabsTrigger value="leave" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md transition-all">Store Leave</TabsTrigger>
                    </TabsList>

                    <TabsContent value="hours" className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
                        <div className="bg-white rounded-xl border shadow-sm">
                            <div className="grid grid-cols-4 gap-4 p-3 border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <div className="col-span-1">Day</div>
                                <div className="col-span-2 text-center">Hours</div>
                                <div className="col-span-1 text-right">Status</div>
                            </div>
                            <div className="divide-y">
                                {hours.map((item, index) => (
                                    <div key={item.day} className={`grid grid-cols-4 gap-4 p-3 items-center hover:bg-gray-50 transition-colors ${item.isClosed ? 'bg-gray-50/50' : ''}`}>
                                        <div className="col-span-1 font-medium text-gray-700 text-sm">{item.day}</div>

                                        <div className="col-span-2 flex items-center justify-center gap-2">
                                            {!item.isClosed ? (
                                                <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-md border">
                                                    <Clock className="h-3 w-3 text-gray-400" />
                                                    <input
                                                        type="time"
                                                        value={item.open}
                                                        onChange={(e) => handleHourChange(index, 'open', e.target.value)}
                                                        className="bg-transparent border-none text-sm focus:ring-0 p-0 w-[60px] text-center"
                                                    />
                                                    <span className="text-gray-300">|</span>
                                                    <input
                                                        type="time"
                                                        value={item.close}
                                                        onChange={(e) => handleHourChange(index, 'close', e.target.value)}
                                                        className="bg-transparent border-none text-sm focus:ring-0 p-0 w-[60px] text-center"
                                                    />
                                                </div>
                                            ) : (
                                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Closed</span>
                                            )}
                                        </div>

                                        <div className="col-span-1 flex justify-end">
                                            <Switch
                                                id={`closed-${index}`}
                                                checked={!item.isClosed}
                                                onCheckedChange={(checked) => handleHourChange(index, 'isClosed', !checked)}
                                                className="data-[state=checked]:bg-green-600"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="leave" className="space-y-6 px-6 py-4">
                        <div className="flex items-center justify-between p-5 border border-orange-200 rounded-xl bg-gradient-to-r from-orange-50 to-white shadow-sm">
                            <div className="space-y-1">
                                <h4 className="font-bold text-orange-900 flex items-center gap-2">
                                    <span className="flex h-2 w-2 rounded-full bg-orange-500"></span>
                                    Enable Store Leave
                                </h4>
                                <p className="text-sm text-orange-700/80">Temporarily close your store for vacations or maintenance.</p>
                            </div>
                            <Switch
                                checked={leave.isActive}
                                onCheckedChange={(checked) => handleLeaveChange('isActive', checked)}
                                className="data-[state=checked]:bg-orange-500"
                            />
                        </div>

                        {leave.isActive && (
                            <div className="space-y-5 p-5 border rounded-xl bg-white shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">Start Date</Label>
                                        <Input
                                            type="date"
                                            className="h-10"
                                            value={leave.startDate ? leave.startDate.split('T')[0] : ''} // basic format
                                            onChange={(e) => handleLeaveChange('startDate', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">End Date</Label>
                                        <Input
                                            type="date"
                                            className="h-10"
                                            value={leave.endDate ? leave.endDate.split('T')[0] : ''}
                                            onChange={(e) => handleLeaveChange('endDate', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-700">Reason for Leave</Label>
                                    <Input
                                        className="h-10"
                                        placeholder="e.g. Family Vacation, Renovation..."
                                        value={leave.reason}
                                        onChange={(e) => handleLeaveChange('reason', e.target.value)}
                                    />
                                    <p className="text-[10px] text-gray-400 text-right">Visible to admins for approval.</p>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <DialogFooter className="p-4 border-t bg-gray-50/50">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-green-600 hover:bg-green-700">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default OperatingHoursDialog;
