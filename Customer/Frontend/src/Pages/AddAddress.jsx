import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Navbar from '../navbar/Navbar';
import Footer from '../navbar/Footer';
import apiService from '../services/apiService';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks and location updates
const LocationMarker = ({ position, onLocationSelect, isEditing }) => {
    // Internal state to show marker immediately on click before parent updates or just to track local click
    // However, parent controls the source of truth "formData". 
    // We can rely on 'position' prop passed from parent.

    const map = useMapEvents({
        click(e) {
            onLocationSelect(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
        locationfound(e) {
            // Only auto-set if not editing existing
            if (!isEditing && !position) {
                onLocationSelect(e.latlng);
                map.flyTo(e.latlng, map.getZoom());
            }
        },
    });

    // Try to locate user on first load if adding new address and no position set
    useEffect(() => {
        if (!isEditing && !position) {
            map.locate();
        } else if (position) {
            // Center on existing location
            map.setView(position, 13);
        }
    }, [map, isEditing, position]); // Ensure this runs correctly

    // Only render marker if position exists
    return position ? <Marker position={position}></Marker> : null;
};

export default function AddAddress() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');
    const [addresses, setAddresses] = useState([]);
    const [editingId, setEditingId] = useState(null);

    const dispatchFrom = location.state?.from || '/profile';

    const [formData, setFormData] = useState({
        name: currentUser?.displayName || '',
        houseNumber: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        latitude: null,
        longitude: null,
        isDefault: false
    });

    useEffect(() => {
        if (currentUser) {
            fetchAddresses();
        }
    }, [currentUser]);

    const fetchAddresses = async () => {
        try {
            setPageLoading(true);
            const response = await apiService.get(`/users/${currentUser.uid}`);
            if (response.success && response.user) {
                setAddresses(response.user.addresses || []);
            }
        } catch (err) {
            console.error("Failed to fetch addresses", err);
        } finally {
            setPageLoading(false);
        }
    };

    const handleEdit = (addr) => {
        setEditingId(addr._id);
        setFormData({
            name: addr.name || '',
            houseNumber: addr.houseNumber || '',
            street: addr.street || '',
            city: addr.city || '',
            state: addr.state || '',
            zipCode: addr.zipCode || '',
            country: addr.country || '',
            latitude: addr.latitude || null,
            longitude: addr.longitude || null,
            isDefault: addr.isDefault || false
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({
            name: currentUser?.displayName || '',
            houseNumber: '',
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: '',
            latitude: null,
            longitude: null,
            isDefault: false
        });
    };

    const handleSetDefault = async (addressId) => {
        if (!window.confirm("Set this as your default address?")) return;
        try {
            setLoading(true);
            const response = await apiService.put('/users/address/set-default', {
                uid: currentUser.uid,
                addressId
            });
            if (response.success) {
                fetchAddresses();
                navigate(dispatchFrom);
            }
        } catch (err) {
            console.error("Failed to set default", err);
            setError("Failed to update default address");
            setLoading(false);
        }
    };

    const handleDelete = async (addressId) => {
        if (!window.confirm("Are you sure you want to delete this address?")) return;
        try {
            const response = await apiService.delete(`/users/address/${addressId}?uid=${currentUser.uid}`);
            if (response.success) {
                setAddresses(addresses.filter(a => a._id !== addressId));
            } else {
                alert(response.message);
            }
        } catch (err) {
            console.error("Failed to delete address", err);
            alert("Failed to delete address");
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleLocationSelect = (latlng) => {
        setFormData(prev => ({
            ...prev,
            latitude: latlng.lat,
            longitude: latlng.lng
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (editingId) {
                await apiService.put(`/users/address/${editingId}`, {
                    uid: currentUser.uid,
                    address: formData
                });
                setEditingId(null);
            } else {
                await apiService.post('/users/address', {
                    uid: currentUser.uid,
                    address: formData
                });
            }

            setFormData({
                name: currentUser?.displayName || '',
                houseNumber: '',
                street: '',
                city: '',
                state: '',
                zipCode: '',
                country: '',
                latitude: null,
                longitude: null,
                isDefault: false
            });
            fetchAddresses();
            navigate(dispatchFrom);
        } catch (err) {
            console.error(err);
            setError('Failed to add address: ' + (err.message || 'Unknown error'));
            setLoading(false);
        }
    };

    const mapPosition = (formData.latitude && formData.longitude)
        ? { lat: formData.latitude, lng: formData.longitude }
        : null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="flex-grow container mx-auto px-4 py-8">
                <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">{editingId ? 'Edit Address' : 'Add New Address'}</h2>
                        <div className="space-x-4">
                            <Link to="/" className="text-sm text-gray-600 hover:text-green-600">Home</Link>
                            <Link to="/profile" className="text-sm text-gray-600 hover:text-green-600">Profile</Link>
                        </div>
                    </div>

                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Resolver name"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">House No. / Building Name</label>
                            <input
                                type="text"
                                name="houseNumber"
                                required
                                value={formData.houseNumber}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Street Address</label>
                            <input
                                type="text"
                                name="street"
                                required
                                value={formData.street}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">City</label>
                                <input
                                    type="text"
                                    name="city"
                                    required
                                    value={formData.city}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">State</label>
                                <input
                                    type="text"
                                    name="state"
                                    required
                                    value={formData.state}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Zip Code</label>
                                <input
                                    type="text"
                                    name="zipCode"
                                    required
                                    value={formData.zipCode}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Country</label>
                                <input
                                    type="text"
                                    name="country"
                                    required
                                    value={formData.country}
                                    onChange={handleChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2"
                                />
                            </div>
                        </div>

                        {/* Map Section */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Pinpoint Location</label>
                            <div className="h-64 w-full rounded-md border border-gray-300 overflow-hidden relative z-0">
                                <MapContainer
                                    center={[51.505, -0.09]}
                                    zoom={13}
                                    scrollWheelZoom={false}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        attribution='Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a>'
                                        url={`https://maps.geoapify.com/v1/tile/osm-bright-smooth/{z}/{x}/{y}.png?apiKey=${import.meta.env.VITE_GEOAPIFY_API_KEY}`}
                                    />
                                    <LocationMarker
                                        position={mapPosition}
                                        onLocationSelect={handleLocationSelect}
                                        isEditing={!!editingId}
                                    />
                                </MapContainer>
                            </div>
                            {formData.latitude && (
                                <p className="text-xs text-green-600">
                                    Location selected: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                                </p>
                            )}
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="isDefault"
                                id="isDefault"
                                checked={formData.isDefault}
                                onChange={handleChange}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                                Set as default address
                            </label>
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : (editingId ? 'Update Address' : 'Save Address')}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Existing Addresses Section */}
                {addresses.length > 0 && (
                    <div className="max-w-md mx-auto mt-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Saved Addresses</h3>
                        <div className="space-y-4">
                            {addresses.map((addr) => (
                                <div key={addr._id} className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                <span className="font-bold">{addr.name}</span><br />
                                                {addr.houseNumber} {addr.street}, {addr.city}
                                            </p>
                                            <p className="text-sm text-gray-500">{addr.state}, {addr.zipCode}</p>
                                            <p className="text-sm text-gray-500">{addr.country}</p>
                                            {addr.isDefault && (
                                                <span className="inline-block mt-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                                    Default Address
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-2 mt-2">

                                            {!addr.isDefault && (
                                                <button
                                                    onClick={() => handleSetDefault(addr._id)}
                                                    disabled={loading}
                                                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded border border-gray-300 transition"
                                                >
                                                    Make Default
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEdit(addr)}
                                                className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded border border-blue-200 transition"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(addr._id)}
                                                className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded border border-red-200 transition"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}
