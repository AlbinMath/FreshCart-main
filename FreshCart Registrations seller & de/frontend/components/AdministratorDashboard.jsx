import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Trash2, CheckCircle, XCircle, Eye, Plus, Download, ShoppingBag, LogOut, Store, Truck } from 'lucide-react';

export default function AdministratorDashboard({ onLogout }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : { email: 'Administrator' };
  });
  const [activeTab, setActiveTab] = useState("sellers");
  const [sellers, setSellers] = useState([]);
  const [deliveryAgents, setDeliveryAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chat State
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch messages when chat tab is active
  useEffect(() => {
    if (activeTab === "chat") {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/communication/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/communication/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: user.email || 'Administrator',
          role: 'Administrator',
          message: newMessage
        })
      });

      if (response.ok) {
        setNewMessage("");
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      // Fetch approved sellers
      const sellersRes = await fetch(`${import.meta.env.VITE_API_URL}/api/administrator/sellers/approved`, { headers });
      if (sellersRes.ok) {
        const sellersData = await sellersRes.json();
        // Map backend data to frontend structure if needed
        const formattedSellers = sellersData.map(s => ({
          id: s._id,
          name: s.storeName, // Using storeName as main identifier for now
          storeName: s.storeName,
          email: s.email,
          phone: s.phoneNumber,
          category: (s.productCategories && s.productCategories.length > 0)
            ? s.productCategories.join(', ')
            : (s.categoryOfProducts || 'N/A'),
          approvedDate: s.approvedAt ? new Date(s.approvedAt).toLocaleDateString() : 'N/A',
          confirmed: s.isConfirmed || false,
          // Extra fields for CSV Export
          sellerName: s.sellerName,
          contactPersonName: s.contactPersonName,
          businessType: s.businessType,
          gstNumber: s.businessRegistrationNumberOrGST,
          fssaiLicense: s.fssaiLicenseNumber,
          operatingHours: s.operatingHours,
          storeAddress: s.storeAddress,
          pinCode: s.pinCode,
          deliveryMethod: s.deliveryMethod,
          bankAccountHolder: s.bankAccountHolderName,
          bankAccountNumber: s.bankAccountNumber,
          ifscCode: s.ifscCode,
          upiId: s.upiId,
          panNumber: s.panNumber,
          status: s.status,
          idProofStatus: s.idProofStatus,
          gstStatus: s.gstDocumentStatus,
          fssaiStatus: s.fssaiLicenseStatus
        }));
        setSellers(formattedSellers);
      }

      // Fetch approved delivery agents
      const agentsRes = await fetch(`${import.meta.env.VITE_API_URL}/api/administrator/delivery-agents/approved`, { headers });
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        const formattedAgents = agentsData.map(a => ({
          id: a._id,
          name: a.fullName,
          email: a.email,
          phone: a.contactNumber,
          vehicleRegNo: a.vehicleRegistrationNumber || 'N/A',
          approvedDate: a.approvedAt ? new Date(a.approvedAt).toLocaleDateString() : 'N/A',
          confirmed: a.isConfirmed || false,
          // Extra fields for CSV Export
          fullName: a.fullName,
          dateOfBirth: a.dateOfBirth ? new Date(a.dateOfBirth).toLocaleDateString() : 'N/A',
          contactNumber: a.contactNumber,
          // email: a.email, // Removed duplicate
          residentialAddress: a.residentialAddress,
          pinCode: a.pinCode,
          vehicleRegistrationNumber: a.vehicleRegistrationNumber,
          bankAccountNumber: a.bankAccountNumber,
          ifscCode: a.ifscCode,
          upiId: a.upiId,
          accountHolderName: a.accountHolderName,
          status: a.status
        }));
        setDeliveryAgents(formattedAgents);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportSeller = (seller) => {
    exportToCSV(
      [seller],
      `seller_${seller.id}_${new Date().toISOString().split("T")[0]}.csv`
    );
  };

  const handleExportAgent = (agent) => {
    exportToCSV(
      [agent],
      `delivery_agent_${agent.id}_${new Date().toISOString().split("T")[0]}.csv`
    );
  };

  const handleToggleSellerConfirm = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/administrator/sellers/${id}/confirm`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSellers(
          sellers.map((seller) =>
            seller.id === id ? { ...seller, confirmed: true } : seller
          )
        );
      }
    } catch (error) {
      console.error('Error confirming seller:', error);
    }
  };

  const handleToggleAgentConfirm = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/administrator/delivery-agents/${id}/confirm`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setDeliveryAgents(
          deliveryAgents.map((agent) =>
            agent.id === id ? { ...agent, confirmed: true } : agent
          )
        );
      }
    } catch (error) {
      console.error('Error confirming agent:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-gray-900">Administrator Dashboard</h1>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => {
                if (onLogout) onLogout();
                else {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  navigate('/admin-login');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 transition"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Store className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Approved Sellers</p>
                <p className="text-2xl text-gray-900">{sellers.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Truck className="w-8 h-8 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Approved Agents</p>
                <p className="text-2xl text-gray-900">
                  {deliveryAgents.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl text-gray-900">
                  {sellers.length + deliveryAgents.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("sellers")}
              className={`flex items-center gap-2 px-6 py-4 ${activeTab === "sellers"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              <Store className="w-5 h-5" />
              Approved Sellers
            </button>
            <button
              onClick={() => setActiveTab("agents")}
              className={`flex items-center gap-2 px-6 py-4 ${activeTab === "agents"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              <Truck className="w-5 h-5" />
              Approved Delivery Agents
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-6 py-4 ${activeTab === "chat"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              <MessageSquare className="w-5 h-5" />
              Communication
            </button>
          </div>
        </div>

        {/* Approved Sellers Tab */}
        {activeTab === "sellers" && (
          <div className="space-y-6">
            <h2 className="text-gray-900">Approved Sellers</h2>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-gray-700">ID</th>
                      <th className="px-6 py-3 text-left text-gray-700">Owner Name</th>
                      <th className="px-6 py-3 text-left text-gray-700">Store Name</th>
                      <th className="px-6 py-3 text-left text-gray-700">Email</th>
                      <th className="px-6 py-3 text-left text-gray-700">Phone</th>
                      <th className="px-6 py-3 text-left text-gray-700">Category</th>
                      <th className="px-6 py-3 text-left text-gray-700">Approved Date</th>
                      <th className="px-6 py-3 text-left text-gray-700">Confirm Register</th>
                      <th className="px-6 py-3 text-left text-gray-700">Export</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sellers.map((seller) => (
                      <tr key={seller.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900">{seller.id}</td>
                        <td className="px-6 py-4 text-gray-900">{seller.name}</td>
                        <td className="px-6 py-4 text-gray-900">{seller.storeName}</td>
                        <td className="px-6 py-4 text-gray-700">{seller.email}</td>
                        <td className="px-6 py-4 text-gray-700">{seller.phone}</td>
                        <td className="px-6 py-4 text-gray-700">{seller.category}</td>
                        <td className="px-6 py-4 text-gray-700">{seller.approvedDate}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleSellerConfirm(seller.id)}
                            disabled={seller.confirmed}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition ${seller.confirmed
                              ? "bg-green-100 text-green-700 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                              }`}
                          >
                            {seller.confirmed ? "Account Created" : "Create Account"}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleExportSeller(seller)}
                            className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                            title="Export to CSV"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Total Sellers:</strong> {sellers.length} approved
                sellers are currently active on the platform.
              </p>
            </div>
          </div>
        )}

        {/* Approved Delivery Agents Tab */}
        {activeTab === "agents" && (
          <div className="space-y-6">
            <h2 className="text-gray-900">Approved Delivery Agents</h2>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-gray-700">ID</th>
                      <th className="px-6 py-3 text-left text-gray-700">Name</th>
                      <th className="px-6 py-3 text-left text-gray-700">Email</th>
                      <th className="px-6 py-3 text-left text-gray-700">Phone</th>
                      <th className="px-6 py-3 text-left text-gray-700">Vehicle Reg No</th>
                      <th className="px-6 py-3 text-left text-gray-700">Approved Date</th>
                      <th className="px-6 py-3 text-left text-gray-700">Confirm Register</th>
                      <th className="px-6 py-3 text-left text-gray-700">Export</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {deliveryAgents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900">{agent.id}</td>
                        <td className="px-6 py-4 text-gray-900">{agent.name}</td>
                        <td className="px-6 py-4 text-gray-700">{agent.email}</td>
                        <td className="px-6 py-4 text-gray-700">{agent.phone}</td>
                        <td className="px-6 py-4 text-gray-700">{agent.vehicleRegNo}</td>
                        <td className="px-6 py-4 text-gray-700">{agent.approvedDate}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleAgentConfirm(agent.id)}
                            disabled={agent.confirmed}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition ${agent.confirmed
                              ? "bg-green-100 text-green-700 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                              }`}
                          >
                            {agent.confirmed ? "Account Created" : "Create Account"}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleExportAgent(agent)}
                            className="p-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition"
                            title="Export to CSV"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Total Agents:</strong> {deliveryAgents.length} approved
                delivery agents are currently active on the platform.
              </p>
            </div>
          </div>
        )}

        {/* Communication Tab */}
        {activeTab === "chat" && (
          <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-gray-900">Admin/Administrator Communication</h2>
              <p className="text-sm text-gray-500">Messages are auto-deleted after 7 days</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" id="chat-container">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.role === 'Administrator' ? 'items-end' : 'items-start'
                    }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${msg.role === 'Administrator'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                      }`}
                  >
                    <p className="text-sm font-semibold mb-1">{msg.sender}</p>
                    <p>{msg.message}</p>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">
                    {new Date(msg.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
