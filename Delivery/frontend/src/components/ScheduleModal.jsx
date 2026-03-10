import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Calendar as CalendarIcon, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const TIME_SLOTS = [
    "6:00 AM – 8:00 AM",
    "8:00 AM – 10:00 AM",
    "10:00 AM – 12:00 PM",
    "12:00 PM – 4:00 PM",
    "4:00 PM – 6:00 PM",
    "6:00 PM – 8:00 PM"
];

const ScheduleModal = ({ isOpen, onClose, onScheduleUpdate }) => {
    const [selectedDate, setSelectedDate] = useState('Today');
    const [customDate, setCustomDate] = useState('');
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Get Agent ID
    const agentData = JSON.parse(localStorage.getItem('agent') || '{}');
    const agentId = agentData.id;

    const getFormattedDate = (type) => {
        const today = new Date();
        if (type === 'Today') return today.toISOString().split('T')[0];
        if (type === 'Tomorrow') {
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
        }
        return customDate;
    };

    const currentFormattedDate = getFormattedDate(selectedDate);

    // Fetch existing schedule when date changes
    useEffect(() => {
        if (!isOpen || !agentId || !currentFormattedDate) return;

        const fetchSchedule = async () => {
            setLoading(true);
            try {
                // Fetch all schedules for agent and find the one matching the date
                // Ideally this should be a specific API call for date, but fetching all is fine for now
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/schedule/${agentId}`);
                const schedule = response.data.find(s => s.date === currentFormattedDate);
                if (schedule) {
                    setSelectedSlots(schedule.slots);
                } else {
                    setSelectedSlots([]);
                }
            } catch (error) {
                console.error("Failed to fetch schedule", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [isOpen, selectedDate, customDate, agentId, currentFormattedDate]);

    const handleSlotToggle = (slot) => {
        if (selectedSlots.includes(slot)) {
            setSelectedSlots(selectedSlots.filter(s => s !== slot));
        } else {
            setSelectedSlots([...selectedSlots, slot]);
        }
    };

    const handleSave = async () => {
        if (!currentFormattedDate) {
            toast.error("Please select a valid date");
            return;
        }

        setSaving(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/schedule`, {
                agentId,
                date: currentFormattedDate,
                slots: selectedSlots
            });
            toast.success('Schedule updated successfully!');
            if (onScheduleUpdate) onScheduleUpdate();
            onClose();
        } catch (error) {
            console.error("Failed to save schedule", error);
            toast.error("Failed to save schedule. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-green-600 p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <CalendarIcon size={20} />
                        Delivery Scheduling
                    </h3>
                    <button onClick={onClose} className="hover:bg-green-700 p-1 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Step 1: Date Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Step 1: Select Delivery Date</label>
                        <div className="flex gap-2">
                            {['Today', 'Tomorrow'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => { setSelectedDate(type); setCustomDate(''); }}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors
                                        ${selectedDate === type
                                            ? 'bg-green-50 border-green-500 text-green-700'
                                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {type}
                                </button>
                            ))}
                            <button
                                onClick={() => setSelectedDate('Pick Date')}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors
                                    ${selectedDate === 'Pick Date'
                                        ? 'bg-green-50 border-green-500 text-green-700'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                Pick Date 📅
                            </button>
                        </div>
                        {selectedDate === 'Pick Date' && (
                            <input
                                type="date"
                                className="mt-3 w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 outline-none"
                                value={customDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => setCustomDate(e.target.value)}
                            />
                        )}
                    </div>

                    {/* Step 2: Time Slot Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Step 2: Available Time Slots</label>

                        {loading ? (
                            <div className="text-center py-4 text-gray-500">Loading slots...</div>
                        ) : (
                            <div className="space-y-2">
                                {TIME_SLOTS.map((slot) => (
                                    <label key={slot} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500 border-gray-300"
                                            checked={selectedSlots.includes(slot)}
                                            onChange={() => handleSlotToggle(slot)}
                                        />
                                        <span className="ml-3 text-gray-700 text-sm font-medium">{slot}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? 'Saving...' : 'Confirm Availability'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleModal;
