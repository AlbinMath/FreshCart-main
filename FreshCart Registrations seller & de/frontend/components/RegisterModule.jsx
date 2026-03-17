import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { User, Store } from 'lucide-react';

export default function RegisterModule() {
  const [userType, setUserType] = useState('');

  const handleUserTypeSelect = (type) => {
    setUserType(type);
  };

  return (
    <div className="min-h-screen bg-gray-50">


      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">FreshCart Registration Portal</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join our network as a seller or delivery agent and start serving customers in your area
          </p>
        </div>

        {!userType ? (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Select Registration Type</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {/* Seller Registration Card */}
              <div
                className="border-2 border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-green-500 hover:shadow-md transition-all duration-300"
                onClick={() => handleUserTypeSelect('seller')}
              >
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Store className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Seller Registration</h3>
                <p className="text-gray-600 mb-6">
                  Register as a seller to list your products and start selling on FreshCart
                </p>
                <ul className="text-left text-gray-600 space-y-2 mb-6">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span>List fresh produce and groceries</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span>Manage inventory and pricing</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    <span>Access sales analytics</span>
                  </li>
                </ul>
                <button className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium">
                  Register as Seller
                </button>
              </div>

              {/* Delivery Agent Registration Card */}
              <div
                className="border-2 border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-orange-500 hover:shadow-md transition-all duration-300"
                onClick={() => handleUserTypeSelect('delivery')}
              >
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Delivery Agent Registration</h3>
                <p className="text-gray-600 mb-6">
                  Join as a delivery agent to earn money by delivering orders
                </p>
                <ul className="text-left text-gray-600 space-y-2 mb-6">
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span>Flexible working hours</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span>Weekly payouts</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span>Insurance coverage during deliveries</span>
                  </li>
                </ul>
                <button className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium">
                  Register as Delivery Agent
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">
                {userType === 'seller' ? 'Seller Registration' : 'Delivery Agent Registration'}
              </h2>
              <button
                onClick={() => setUserType('')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to selection
              </button>
            </div>

            {userType === 'seller' ? (
              // We'll dynamically import the SellerRegistration component
              <div className="text-center py-12">
                <p className="text-gray-600">Loading seller registration form...</p>
              </div>
            ) : (
              // We'll dynamically import the DeliveryAgentRegistration component
              <div className="text-center py-12">
                <p className="text-gray-600">Loading delivery agent registration form...</p>
              </div>
            )}
          </div>
        )}
      </div>


    </div>
  );
}