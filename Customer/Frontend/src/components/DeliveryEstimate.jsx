import React, { useState, useEffect } from 'react';

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

/** Geocode a text address → {lat, lon} via OpenStreetMap Nominatim (free, no key) */
export async function geocodeAddress(address) {
    if (!address) return null;
    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
        const res = await fetch(url, {
            headers: { 'Accept-Language': 'en', 'User-Agent': 'FreshCart-App/1.0' }
        });
        const data = await res.json();
        if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        return null;
    } catch { return null; }
}

/** Haversine straight-line distance in km */
export function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Get browser geolocation as a Promise */
export function getBrowserPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) { reject(new Error('no-geolocation')); return; }
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
    });
}

/** Format minutes → "X h Y min" or "Y min" */
export function formatMinutes(mins) {
    if (mins >= 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    return `${mins} min`;
}

const AVG_SPEED_KMH = 30;  // delivery vehicle average speed
const BUFFER_MINS = 3;      // fixed dispatch buffer

// ─────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string}  opts.storeAddress   - seller's store address text
 * @param {number}  opts.prepMins       - product prep time in minutes
 * @param {object}  [opts.savedAddress] - { latitude, longitude } from customer's saved address (preferred)
 */
export function useDeliveryEstimate({ storeAddress, prepMins = 0, savedAddress = null }) {
    const [state, setState] = useState({ status: 'loading', estimate: null, distanceKm: null });

    useEffect(() => {
        let cancelled = false;
        setState({ status: 'loading', estimate: null, distanceKm: null });

        async function compute() {
            // 1. Get customer position
            let userLat = null, userLon = null;

            if (savedAddress?.latitude && savedAddress?.longitude) {
                userLat = savedAddress.latitude;
                userLon = savedAddress.longitude;
            } else {
                try {
                    const pos = await getBrowserPosition();
                    userLat = pos.coords.latitude;
                    userLon = pos.coords.longitude;
                } catch { /* no GPS */ }
            }

            // 2. Get seller position via geocoding
            let sellerLat = null, sellerLon = null;
            if (storeAddress) {
                const sp = await geocodeAddress(storeAddress);
                if (sp) { sellerLat = sp.lat; sellerLon = sp.lon; }
            }

            if (cancelled) return;

            if (userLat && sellerLat) {
                const km = haversineKm(userLat, userLon, sellerLat, sellerLon);
                const travelMins = Math.ceil((km / AVG_SPEED_KMH) * 60);
                const total = prepMins + travelMins + BUFFER_MINS;
                setState({ status: 'ready', estimate: total, distanceKm: km });
            } else if (prepMins > 0) {
                setState({
                    status: userLat ? 'no-address' : 'no-location',
                    estimate: prepMins + BUFFER_MINS,
                    distanceKm: null
                });
            } else {
                setState({ status: 'error', estimate: null, distanceKm: null });
            }
        }

        compute();
        return () => { cancelled = true; };
    }, [storeAddress, prepMins, savedAddress?.latitude, savedAddress?.longitude]);

    return state;
}

// ─────────────────────────────────────────
// UI COMPONENT
// ─────────────────────────────────────────

/**
 * Delivery estimate card showing total time + breakdown chips.
 *
 * Props:
 *   storeAddress  string        – seller store address
 *   prepMins      number        – product prep time (minutes)
 *   savedAddress  object|null   – customer saved address { latitude, longitude }
 */
export default function DeliveryEstimate({ storeAddress, prepMins = 0, savedAddress = null }) {
    const { status, estimate, distanceKm } = useDeliveryEstimate({ storeAddress, prepMins, savedAddress });

    // ── Loading ──
    if (status === 'loading') {
        return (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🕐</span>
                    <span className="text-sm font-semibold text-blue-800 uppercase tracking-wide">Estimated Delivery Time</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-500">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    Calculating...
                </div>
            </div>
        );
    }

    // ── Error / nothing to show ──
    if (status === 'error' || estimate === null) {
        return (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🕐</span>
                    <span className="text-sm text-gray-500">Delivery time unavailable</span>
                </div>
            </div>
        );
    }

    // ── Build breakdown pills ──
    const pills = [];
    if (prepMins > 0) pills.push({ icon: '⏱️', label: 'Prep', value: `${prepMins} min` });
    if (distanceKm !== null) {
        const travelMins = Math.ceil((distanceKm / AVG_SPEED_KMH) * 60);
        pills.push({ icon: '🚚', label: `${distanceKm.toFixed(1)} km`, value: `${travelMins} min` });
    }
    pills.push({ icon: '⚡', label: 'Buffer', value: `${BUFFER_MINS} min` });

    return (
        <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-100 rounded-xl p-4">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🚀</span>
                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Estimated Delivery</span>
                </div>
                <span className="text-2xl font-extrabold text-emerald-600">{formatMinutes(estimate)}</span>
            </div>

            {/* Breakdown chips */}
            <div className="flex flex-wrap items-center gap-1.5">
                {pills.map((p, i) => (
                    <React.Fragment key={i}>
                        <div className="bg-white rounded-lg px-2.5 py-1 text-xs shadow-sm border border-gray-100 flex items-center gap-1">
                            <span>{p.icon}</span>
                            <span className="text-gray-500">{p.label}:</span>
                            <span className="font-bold text-gray-800">{p.value}</span>
                        </div>
                        {i < pills.length - 1 && <span className="text-gray-400 text-xs font-bold">+</span>}
                    </React.Fragment>
                ))}
                <span className="text-gray-400 text-xs font-bold">=</span>
                <div className="bg-emerald-100 text-emerald-800 rounded-lg px-2.5 py-1 text-xs font-extrabold border border-emerald-200">
                    {formatMinutes(estimate)}
                </div>
            </div>

            {/* Partial-data notices */}
            {status === 'no-location' && (
                <p className="text-xs text-amber-500 mt-2">📍 Allow location access for a precise estimate.</p>
            )}
            {status === 'no-address' && (
                <p className="text-xs text-amber-500 mt-2">⚠️ Seller address unavailable — showing prep + buffer only.</p>
            )}
        </div>
    );
}
