import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-green-500 p-2 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl text-gray-900">Freshkart</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {isHomePage ? (
              <>
                <a href="#features" className="text-gray-700 hover:text-green-600 transition">Features</a>
                <a href="#announcements" className="text-gray-700 hover:text-green-600 transition">Announcements</a>
              </>
            ) : (
              <>
                <Link to="/#features" className="text-gray-700 hover:text-green-600 transition">Features</Link>
                <Link to="/#announcements" className="text-gray-700 hover:text-green-600 transition">Announcements</Link>
              </>
            )}
            <Link to="/check-status" className="text-gray-700 hover:text-green-600 transition">Check Status</Link>
            <div className="flex gap-3">
              <Link to="/seller-registration" className="px-4 py-2 text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition">
                Register as Seller
              </Link>
              <Link to="/delivery-agent-registration" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                Join as Delivery Agent
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              {isHomePage ? (
                <>
                  <a href="#features" className="text-gray-700 hover:text-green-600 transition">Features</a>
                  <a href="#announcements" className="text-gray-700 hover:text-green-600 transition">Announcements</a>
                </>
              ) : (
                <>
                  <Link to="/#features" className="text-gray-700 hover:text-green-600 transition" onClick={() => setMobileMenuOpen(false)}>Features</Link>
                  <Link to="/#announcements" className="text-gray-700 hover:text-green-600 transition" onClick={() => setMobileMenuOpen(false)}>Announcements</Link>
                </>
              )}
              <Link to="/check-status" className="text-gray-700 hover:text-green-600 transition">Check Status</Link>
              <Link to="/test" className="text-gray-700 hover:text-green-600 transition">Test</Link>
              <Link to="/seller-registration" className="px-4 py-2 text-center text-green-600 border border-green-600 rounded-lg hover:bg-green-50 transition">
                Register as Seller
              </Link>
              <Link to="/delivery-agent-registration" className="px-4 py-2 text-center bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                Join as Delivery Agent
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
