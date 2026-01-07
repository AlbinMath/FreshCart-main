import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layout/DashboardLayout';
import LoginPage from './pages/Login';
import DashboardOverview from './pages/DashboardOverview';
import UserManagement from './pages/UserManagement';
import ProductApproval from './pages/ProductApproval';
import Orders from './pages/Orders';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import MarketingPromotions from './pages/MarketingPromotions';

import ProtectedRoute from './components/ProtectedRoute';

function App() {


    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route path="/" element={<Navigate to="/dashboard/overview" replace />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardLayout />}>
                        <Route path="overview" element={<DashboardOverview />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="product-approval" element={<ProductApproval />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="payments" element={<Payments />} />
                        <Route path="reports" element={<Reports />} />
                        <Route path="marketing" element={<MarketingPromotions />} />

                        {/* Add other routes here */}
                    </Route>
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
