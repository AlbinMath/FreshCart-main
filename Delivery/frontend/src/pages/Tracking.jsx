import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'; // Import Routing Machine CSS
import io from 'socket.io-client';
import L from 'leaflet';
import 'leaflet-routing-machine'; // Import Routing Machine JS
import axios from 'axios';
import LoadingScreen from '../components/LoadingScreen';

// Fix for default Leaflet marker icons not showing
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});

// Create a custom icon for Stores (e.g. Red)
const StoreIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Create a custom icon for Delivery Destination (e.g. Green)
const DeliveryIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const SOCKET_URL = 'http://localhost:5007';

// Component to handle map center updates
const MapUpdater = ({ center, bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.flyToBounds(bounds, { padding: [50, 50] });
        } else if (center) {
            map.flyTo(center, 13);
        }
    }, [center, bounds, map]);
    return null;
};

// Routing Machine Component
const RoutingMachine = ({ start, end }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || !start || !end) return;

        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(start.lat, start.lng),
                L.latLng(end.lat, end.lng)
            ],
            routeWhileDragging: false,
            show: true,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: false,
            showAlternatives: false,
            createMarker: function () { return null; }
        }).addTo(map);

        return () => {
            map.removeControl(routingControl);
        };
    }, [map, start, end]);

    return null;
};

const Tracking = () => {
    const [searchParams] = useSearchParams();
    const [agents, setAgents] = useState({});
    const [sellers, setSellers] = useState([]);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [deliveryLocation, setDeliveryLocation] = useState(null);
    const [mapBounds, setMapBounds] = useState(null);

    // Parse Query Params
    useEffect(() => {
        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        const address = searchParams.get('address');
        const orderId = searchParams.get('orderId');

        const resolveLocation = async () => {
            if (lat && lng) {
                setDeliveryLocation({ lat: parseFloat(lat), lng: parseFloat(lng), address, orderId });
            } else if (address) {
                try {
                    const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
                    const geoRes = await axios.get(geoUrl);
                    if (geoRes.data && geoRes.data.length > 0) {
                        setDeliveryLocation({
                            lat: parseFloat(geoRes.data[0].lat),
                            lng: parseFloat(geoRes.data[0].lon),
                            address,
                            orderId
                        });
                    }
                } catch (e) {
                    console.error("Failed to geocode delivery address:", e);
                }
            }
        };

        resolveLocation();
    }, [searchParams]);

    // Update Bounds when locations change
    useEffect(() => {
        if (currentLocation && deliveryLocation) {
            const bounds = L.latLngBounds(
                [currentLocation.lat, currentLocation.lng],
                [deliveryLocation.lat, deliveryLocation.lng]
            );
            setMapBounds(bounds);
        }
    }, [currentLocation, deliveryLocation]);

    // Fetch Sellers & Geocode
    useEffect(() => {
        const fetchSellers = async () => {
            try {
                // Adjust URL based on your backend port/env. Assuming standard or from .env if possible
                // Using hardcoded localhost:5007 for backend API as per context
                const response = await axios.get('http://localhost:5007/api/delivery-agent/sellers');
                const sellerData = response.data;

                // Geocode addresses or use existing lat/long
                const geocodedSellers = await Promise.all(sellerData.map(async (seller) => {
                    // 1. Use existing coordinates if available
                    if (seller.latitude && seller.longitude) {
                        return {
                            ...seller,
                            lat: parseFloat(seller.latitude),
                            lng: parseFloat(seller.longitude)
                        };
                    }

                    // 2. Fallback to geocoding if address exists
                    if (!seller.storeAddress) return null;
                    try {
                        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(seller.storeAddress)}`;
                        const geoRes = await axios.get(geoUrl);
                        if (geoRes.data && geoRes.data.length > 0) {
                            return {
                                ...seller,
                                lat: parseFloat(geoRes.data[0].lat),
                                lng: parseFloat(geoRes.data[0].lon)
                            };
                        }
                    } catch (e) {
                        console.error(`Failed to geocode ${seller.storeName}:`, e);
                    }
                    return null;
                }));

                setSellers(geocodedSellers.filter(s => s !== null));
            } catch (err) {
                console.error("Error fetching sellers:", err);
            }
        };

        fetchSellers();
    }, []);

    useEffect(() => {
        // Get initial location
        // Real-time location tracking
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setCurrentLocation({
                    lat: latitude,
                    lng: longitude
                });
            },
            (error) => {
                console.error("Tracking Page: Error watching location", error);
                // Only set default if we haven't set a location yet
                setCurrentLocation(prev => prev || { lat: 0, lng: 0 });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );

        const socket = io(SOCKET_URL);

        socket.on('agentLocationUpdate', (data) => {
            console.log('Tracking Page: Received agent update:', data);
            setAgents(prev => {
                const updated = {
                    ...prev,
                    [data.agentId]: data.location
                };
                console.log('Tracking Page: Updated agents state:', updated);
                return updated;
            });
        });

        // Listen for status updates to remove offline agents? 
        // Or just update location. If offline, maybe we should remove them.
        socket.on('agentStatusUpdate', (data) => {
            if (data.isOnline === false) {
                setAgents(prev => {
                    const newState = { ...prev };
                    delete newState[data.agentId];
                    return newState;
                });
            }
        });

        return () => {
            socket.disconnect();
            navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    if (!currentLocation) {
        return <LoadingScreen text="Locating..." />;
    }

    return (
        <div className="h-full w-full p-4 space-y-4">
            <h1 className="text-2xl font-bold text-gray-800">
                Live Location Tracking
                {deliveryLocation && <span className="text-sm font-normal text-gray-500 ml-4">Tracking Order: {deliveryLocation.orderId}</span>}
            </h1>
            <div className="h-[600px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 relative z-0">
                <MapContainer
                    center={[currentLocation.lat, currentLocation.lng]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Map Updater for dynamic centering/bounds */}
                    <MapUpdater center={[currentLocation.lat, currentLocation.lng]} bounds={mapBounds} />

                    {/* Routing Machine */}
                    {deliveryLocation && (
                        <RoutingMachine
                            start={currentLocation}
                            end={deliveryLocation}
                        />
                    )}

                    {/* Current User */}
                    <Marker position={[currentLocation.lat, currentLocation.lng]}>
                        <Popup>You are here</Popup>
                    </Marker>

                    {/* Delivery Destination */}
                    {deliveryLocation && (
                        <Marker position={[deliveryLocation.lat, deliveryLocation.lng]} icon={DeliveryIcon}>
                            <Popup>
                                <div className="font-bold">Delivery Location</div>
                                <div className="text-xs">{deliveryLocation.address}</div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Online Agents */}
                    {Object.entries(agents).map(([id, loc]) => (
                        <Marker key={id} position={[loc.lat, loc.lng]}>
                            <Popup>Agent ID: {id}</Popup>
                        </Marker>
                    ))}

                    {/* Sellers/Stores */}
                    {sellers.map((seller, idx) => (
                        <Marker
                            key={`seller-${idx}`}
                            position={[seller.lat, seller.lng]}
                            icon={StoreIcon}
                        >
                            <Popup>
                                <div className="font-bold">{seller.storeName}</div>
                                <div className="text-xs">{seller.storeAddress}</div>
                                <div className="text-xs text-blue-600">{seller.phoneNumber}</div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default Tracking;
