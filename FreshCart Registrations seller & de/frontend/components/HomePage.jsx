import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { Smartphone, Truck, Store, CheckCircle, Shield, Clock, MessageSquare } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import freshVegetablesImage from './img/Gemini_Generated_Image_jan478jan478jan4.png';


export default function HomePage() {
  const [announcements, setAnnouncements] = React.useState([]);

  React.useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/announcements`);
        if (response.ok) {
          const data = await response.json();
          setAnnouncements(data);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    };

    fetchAnnouncements();
  }, []);

  return (
    <div className="min-h-screen bg-white">


      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-gray-900 mb-6">
                Fresh Food Delivered to Your Doorstep
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Freshkart connects customers with local sellers and dedicated delivery partners to bring fresh, quality products directly to homes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#features" className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center">
                  Learn More
                </a>
                <a href="#announcements" className="px-8 py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition text-center">
                  Latest Updates
                </a>
              </div>
            </div>
            <div className="relative">

              <ImageWithFallback
                src={freshVegetablesImage}
                alt="Fresh vegetables and fruits"
                className="rounded-lg shadow-2xl w-full h-[400px] object-cover"
              />

            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-gray-900 mb-4">Our Platform Ecosystem</h2>
            <p className="text-xl text-gray-600">Three apps working together for seamless service</p>
          </div>

          {/* Customer App Features */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Smartphone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-gray-900">Customer App</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
                <h4 className="text-gray-900 mb-2">Browse Fresh Products</h4>
                <p className="text-gray-600">Access a wide range of fresh fruits, vegetables, dairy, and more from verified local sellers.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <Clock className="w-12 h-12 text-green-600 mb-4" />
                <h4 className="text-gray-900 mb-2">Real-Time Tracking</h4>
                <p className="text-gray-600">Track your orders in real-time and know exactly when your delivery will arrive.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <Shield className="w-12 h-12 text-green-600 mb-4" />
                <h4 className="text-gray-900 mb-2">Quality Guaranteed</h4>
                <p className="text-gray-600">All products are quality-checked and come with freshness guarantees.</p>
              </div>
            </div>
          </div>

          {/* Seller App Features */}
          <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-green-100 p-3 rounded-lg">
                <Store className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-gray-900">Seller App</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <Store className="w-12 h-12 text-green-600 mb-4" />
                <h4 className="text-gray-900 mb-2">Easy Store Management</h4>
                <p className="text-gray-600">Manage your product listings, inventory, and pricing from a single dashboard.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <MessageSquare className="w-12 h-12 text-green-600 mb-4" />
                <h4 className="text-gray-900 mb-2">Direct Customer Connect</h4>
                <p className="text-gray-600">Communicate directly with customers and build lasting relationships.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
                <h4 className="text-gray-900 mb-2">Grow Your Business</h4>
                <p className="text-gray-600">Reach more customers, increase sales, and expand your market presence.</p>
              </div>
            </div>
          </div>

          {/* Delivery App Features */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Truck className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-gray-900">Delivery Agent App</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <Truck className="w-12 h-12 text-orange-600 mb-4" />
                <h4 className="text-gray-900 mb-2">Flexible Work Hours</h4>
                <p className="text-gray-600">Choose your own working hours and zones for maximum flexibility.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <Clock className="w-12 h-12 text-orange-600 mb-4" />
                <h4 className="text-gray-900 mb-2">Optimized Routes</h4>
                <p className="text-gray-600">Get smart route optimization to complete more deliveries efficiently.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <CheckCircle className="w-12 h-12 text-orange-600 mb-4" />
                <h4 className="text-gray-900 mb-2">Competitive Earnings</h4>
                <p className="text-gray-600">Earn competitive rates with bonuses and incentives for excellent service.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements Section */}
      <section id="announcements" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-gray-900 mb-4">Latest Announcements</h2>
            <p className="text-xl text-gray-600">Stay updated with the latest news from Freshkart</p>
          </div>

          {announcements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {announcements.map((announcement) => (
                <div key={announcement._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                  <div className="text-sm text-gray-500 mb-2">{announcement.date}</div>
                  <h3 className="text-gray-900 mb-3">{announcement.title}</h3>
                  <p className="text-gray-600 mb-4">{announcement.content}</p>
                  <div className="text-sm text-green-606">Posted by {announcement.author}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p>No announcements at the moment. Check back later!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-white mb-6">Ready to Join Freshkart?</h2>
          <p className="text-xl mb-8 text-green-50">
            Whether you're a seller looking to expand your reach or a delivery partner seeking flexible work, we're here for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/seller-registration" className="px-8 py-3 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition">
              Register as Seller
            </Link>
            <Link to="/delivery-agent-registration" className="px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-white hover:text-green-600 transition">
              Join as Delivery Agent
            </Link>
          </div>
        </div>
      </section>


    </div>
  );
}
