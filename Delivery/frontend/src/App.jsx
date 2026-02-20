import { Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';

import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import MyDelivery from './pages/MyDelivery';
import Earnings from './pages/Earnings';
import DashboardLayout from './layouts/DashboardLayout';

import Tracking from './pages/Tracking';
import LocationManager from './components/LocationManager';
import Settings from './pages/Settings';
import DeliveryHistory from './pages/DeliveryHistory';

function App() {
    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <LocationManager />
            <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                {/* Protected Dashboard Routes */}
                <Route path="/" element={<DashboardLayout />}>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="profile" element={<Profile />} />
                    {/* Placeholder for other sidebar links to avoid 404s immediately */}
                    <Route path="my-delivery" element={<MyDelivery />} />
                    <Route path="delivery-history" element={<DeliveryHistory />} />
                    <Route path="route-planning" element={<div className="p-4">Route Planning Page (Coming Soon)</div>} />
                    <Route path="earnings" element={<Earnings />} />
                    <Route path="tracking" element={<Tracking />} />
                    <Route path="settings" element={<Settings />} />
                </Route>
            </Routes>
        </div>
    );
}

export default App;
