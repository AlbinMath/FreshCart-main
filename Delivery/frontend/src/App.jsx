import { Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';

import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import MyDelivery from './pages/MyDelivery';
import Earnings from './pages/Earnings';
import DashboardLayout from './layouts/DashboardLayout';

function App() {
    return (
        <div className="min-h-screen bg-background font-sans antialiased">
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
                    <Route path="route-planning" element={<div className="p-4">Route Planning Page (Coming Soon)</div>} />
                    <Route path="earnings" element={<Earnings />} />
                    <Route path="tracking" element={<div className="p-4">Location Tracking Page (Coming Soon)</div>} />
                    <Route path="settings" element={<div className="p-4">Profile Settings Page (Coming Soon)</div>} />
                </Route>
            </Routes>
        </div>
    );
}

export default App;
