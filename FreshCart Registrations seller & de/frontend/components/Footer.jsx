import { ShoppingBag, Mail, Linkedin } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Footer() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/admin-login" className="flex items-center gap-2 mb-4 w-fit hover:opacity-80 transition">
              <div className="bg-green-500 p-2 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl text-white">Freshkart</span>
            </Link>
            <p className="text-gray-400 mb-4">
              Delivering fresh, quality products directly to your doorstep.
              Join our platform as a seller or delivery partner today.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                {isHomePage ? (
                  <a href="#features" className="hover:text-green-500 transition">Features</a>
                ) : (
                  <Link to="/#features" className="hover:text-green-500 transition">Features</Link>
                )}
              </li>
              <li><Link to="/seller-registration" className="hover:text-green-500 transition">Become a Seller</Link></li>
              <li><Link to="/delivery-agent-registration" className="hover:text-green-500 transition">Join as Agent</Link></li>
              <li><Link to="/check-status" className="hover:text-green-500 transition">Check Status</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="/privacy-policy" className="hover:text-green-500 transition">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-green-500 transition">Terms of Service</Link></li>
              <li><Link to="/licensing" className="hover:text-green-500 transition">Licensing</Link></li>
              <li><Link to="/cookie-policy" className="hover:text-green-500 transition">Cookie Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white mb-4">Contact</h3>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <span className="block text-sm text-gray-500 mb-1">Email</span>
                  <a href="mailto:albinmathew2026@mca.ajce.in" className="hover:text-green-500 transition break-all">
                    albinmathew2026@mca.ajce.in
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Linkedin className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <span className="block text-sm text-gray-500 mb-1">LinkedIn</span>
                  <a href="https://www.linkedin.com/in/albinmathew2002" target="_blank" rel="noopener noreferrer" className="hover:text-green-500 transition break-all">
                    www.linkedin.com/in/albinmathew2002
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
          <p>&copy; 2025 Freshkart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
