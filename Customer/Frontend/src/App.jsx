import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Profile from "./Pages/Profile";
import AddAddress from "./Pages/AddAddress";
import Cart from "./Pages/Cart";
import ForgotPassword from "./Pages/ForgotPassword";
import ChangePassword from "./Pages/ChangePassword";
import CheckoutAddress from "./Pages/CheckoutAddress";
import CheckoutPayment from "./Pages/CheckoutPayment";
import OrderSuccess from "./Pages/OrderSuccess";
import Orders from "./Pages/Orders";
import { AuthProvider } from "./contexts/AuthContext";

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/add-address" element={<AddAddress />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/change-password" element={<ChangePassword />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout/address" element={<CheckoutAddress />} />
                    <Route path="/checkout/payment" element={<CheckoutPayment />} />
                    <Route path="/order-success/:orderId" element={<OrderSuccess />} />
                    <Route path="/orders" element={<Orders />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
