import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Locate, Search } from 'lucide-react';

// Fix for default Leaflet marker icons usually broken in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const LocationMarker = ({ position, setPosition }) => {
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
};

// Component to handle external position updates (e.g. from existing data)
const MapUpdater = ({ center }) => {
    const map = useMapEvents({});
    useEffect(() => {
        if (center) {
            map.flyTo(center, 13);
        }
    }, [center, map]);
    return null;
};

const LocationPicker = ({ lat, lng, onLocationSelect, isEditing = true }) => {
    // Default to India (approx center) if no location provided
    const defaultPosition = { lat: 20.5937, lng: 78.9629 };
    const [position, setPosition] = useState(lat && lng ? { lat, lng } : null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (lat && lng) {
            setPosition({ lat, lng });
        }
    }, [lat, lng]);

    const handleSetPosition = async (pos) => {
        if (!isEditing) return;
        setPosition(pos);

        let addressDetails = null;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`);
            const data = await response.json();
            addressDetails = {
                display_name: data.display_name,
                address: data.address
            };
        } catch (error) {
            console.error("Reverse geocoding failed", error);
        }

        if (onLocationSelect) {
            onLocationSelect({ ...pos, ...addressDetails });
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const newPos = { lat: parseFloat(lat), lng: parseFloat(lon) };
                handleSetPosition(newPos);
            } else {
                alert('Location not found');
            }
        } catch (error) {
            console.error("Search failed:", error);
            alert('Search failed');
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    };

    const handleUseCurrentLocation = (e) => {
        e.preventDefault(); // Prevent accidental form submissions if inside a form
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPos = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                };
                handleSetPosition(newPos);
            },
            (err) => {
                console.error("Geolocation error:", err);
                let msg = 'Unable to retrieve your location';
                if (err.code === 1) msg = 'Location permission denied';
                else if (err.code === 2) msg = 'Location unavailable';
                else if (err.code === 3) msg = 'Location request timed out';
                alert(msg);
            }
        );
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-green-600" />
                    {isEditing ? "Pinpoint Store Location" : "Store Location"}
                </label>

                {position && (
                    <span className="text-xs text-gray-500 font-mono hidden sm:inline-block">
                        {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                    </span>
                )}
            </div>

            {isEditing && (
                <div className="flex gap-2">
                    <div className="flex-1 flex gap-1">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search area (e.g., MG Road, Bangalore)"
                            className="flex-1 border rounded px-2 py-1 text-sm focus:ring-green-500 focus:border-green-500"
                        />
                        <button
                            type="button"
                            onClick={handleSearch}
                            disabled={isSearching}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                        >
                            {isSearching ? '...' : <><Search className="w-3 h-3" /> Search</>}
                        </button>
                    </div>
                    <button
                        onClick={handleUseCurrentLocation}
                        className="flex items-center gap-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1 rounded border border-green-200 transition-colors whitespace-nowrap"
                        type="button"
                    >
                        <Locate className="w-3 h-3" />
                        <span className="hidden sm:inline">Use Current Location</span>
                        <span className="sm:hidden">Live</span>
                    </button>
                </div>
            )}

            <div className="h-[300px] w-full rounded-lg overflow-hidden border border-gray-200 z-0 relative">
                <MapContainer
                    center={position || defaultPosition}
                    zoom={position ? 13 : 5}
                    scrollWheelZoom={isEditing}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {isEditing && <LocationMarker position={position} setPosition={handleSetPosition} />}
                    {/* If not editing, just show the marker at the fixed position */}
                    {!isEditing && position && <Marker position={position} />}

                    <MapUpdater center={position} />
                </MapContainer>

                {isEditing && !position && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 pointer-events-none z-[400]">
                        <div className="bg-white/90 p-2 rounded shadow-sm text-sm text-gray-600">
                            Click on map to set location
                        </div>
                    </div>
                )}
            </div>
            {isEditing && (
                <p className="text-xs text-gray-500 italic">
                    Click on the map to accurately mark your store's location. This helps customers locate you easily.
                </p>
            )}
        </div>
    );
};

export default LocationPicker;
