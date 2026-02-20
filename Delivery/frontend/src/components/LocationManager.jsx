import React, { useEffect } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5007'; // Ensure this matches backend port

const LocationManager = () => {
    useEffect(() => {
        let socket = null;
        let watchId = null;
        let checkInterval = null;

        const startTracking = () => {
            const agentData = JSON.parse(localStorage.getItem('agent') || '{}');
            const agentId = agentData.id || agentData._id;

            if (!agentId) {
                return false;
            }

            if (socket) return true; // Already running

            socket = io(SOCKET_URL);

            socket.on('connect', () => {
                console.log('Connected to socket server for location tracking');
            });

            socket.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
            });

            let lastLocation = null;

            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    lastLocation = {
                        lat: latitude,
                        lng: longitude
                    };
                },
                (error) => {
                    console.error('Error getting location:', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 5000
                }
            );

            // Send location update every 5 seconds
            const intervalId = setInterval(() => {
                if (lastLocation && socket) {
                    const locationData = {
                        agentId: agentId,
                        location: lastLocation
                    };
                    console.log('LocationManager: Sending location update to server:', locationData);
                    socket.emit('updateLocation', locationData);
                }
            }, 5000);

            // Store intervalId so we can clear it later if needed (though we clear checkInterval, we need to handle this new one)
            // Ideally we should return a cleanup function from startTracking or handle it differently.
            // Since startTracking relies on closure variables, we can add this interval to a list or object accessible by cleanup
            // BUT, looking at the code structure, startTracking is called inside useEffect.
            // Let's attach the interval ID to the socket object or a variable we can access? 
            // Actually, we can just return the cleanup function or modify how we track intervals.

            // Refactoring to be cleaner:
            // Let's attach it to a variable in the outer scope
            // modifying outer scope 'checkInterval' is for the loop related to starting.
            // We need a new variable for the update interval.

            return { socket, watchId, intervalId };
        };

        let trackingResources = null;

        // Try to start immediately
        trackingResources = startTracking();

        // If not started (not logged in), check periodically
        if (!trackingResources) {
            checkInterval = setInterval(() => {
                trackingResources = startTracking();
                if (trackingResources) {
                    clearInterval(checkInterval);
                }
            }, 5000);
        }

        return () => {
            if (trackingResources) {
                if (trackingResources.socket) trackingResources.socket.disconnect();
                if (trackingResources.watchId) navigator.geolocation.clearWatch(trackingResources.watchId);
                if (trackingResources.intervalId) clearInterval(trackingResources.intervalId);
            }
            if (checkInterval) clearInterval(checkInterval);
        };
    }, []);

    return null;
};

export default LocationManager;
