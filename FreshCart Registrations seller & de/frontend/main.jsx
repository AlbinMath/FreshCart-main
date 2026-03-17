import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import SellerRegistration from './components/SellerRegistration';
import DeliveryAgentRegistration from './components/DeliveryAgentRegistration';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import AdministratorDashboard from './components/AdministratorDashboard';
import HomePage from './components/HomePage';
import RegistrationStatus from './components/RegistrationStatus';
import CloudinaryTest from './components/CloudinaryTest';
import TestComponent from './components/TestComponent';
import Header from './components/Header';
import Footer from './components/Footer';
import './index.css';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import Licensing from './components/Licensing';
import CookiePolicy from './components/CookiePolicy';

const Layout = () => {
  const location = useLocation();
  const isDashboardRoute = ['/administrator-dashboard', '/admin-dashboard'].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      {!isDashboardRoute && <Header />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/seller-registration" element={<SellerRegistration />} />
          <Route path="/delivery-agent-registration" element={<DeliveryAgentRegistration />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/administrator-dashboard" element={<AdministratorDashboard />} />
          <Route path="/check-status" element={<RegistrationStatus />} />
          <Route path="/cloudinary-test" element={<CloudinaryTest />} />
          <Route path="/test" element={<TestComponent />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/licensing" element={<Licensing />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
        </Routes>
      </main>
      {!isDashboardRoute && <Footer />}
    </div>
  );
};

const App = () => {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Layout />
    </Router>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);