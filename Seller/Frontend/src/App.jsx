import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// We will create this file next
import Login from './page/login';
import ForgotPassword from './page/forgot-password';
import Profile from './page/profile';
import Settings from './page/settings';
import ProductCatalog from './page/products/ProductCatalog';
import AddProduct from './page/products/AddProduct';
import DashboardLayout from './layout/DashboardLayout';
import StoreOverview from './page/Storeoverview';
import UpdatePassword from './page/UpdatePassword';
import Reports from './page/Reports';
import Orders from './page/Orders';

function App() {
    return (
        <Router>
            <Routes>
                {/* Protected Dashboard Routes */}
                <Route path="/" element={<DashboardLayout />}>
                    <Route index element={<StoreOverview />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="update-password" element={<UpdatePassword />} />

                    {/* Product Management */}
                    <Route path="/products" element={<ProductCatalog />} />
                    <Route path="/products/add" element={<AddProduct />} />
                    <Route path="/products/edit/:id" element={<AddProduct />} />

                    <Route path="/orders" element={<Orders />} />
                    <Route path="/reports" element={<Reports />} />
                </Route>

                {/* Auth Routes */}
                <Route path="/seller-login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
            </Routes>
        </Router>
    );
}

export default App;
