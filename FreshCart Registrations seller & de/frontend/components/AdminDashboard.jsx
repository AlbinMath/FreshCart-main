import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Trash2, CheckCircle, XCircle, Eye, Plus, ShoppingBag, LogOut, FileText, UserCheck, Users } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  // Initialize user state from localStorage
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      navigate('/admin-login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin-login');
  };

  if (!user) return null; // Prevent rendering if redirecting
  // Removed type annotations from useState generic types
  // State Declarations
  const [activeTab, setActiveTab] = useState('posts');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [administrators, setAdministrators] = useState([]);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [showPostForm, setShowPostForm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch announcements on mount
  React.useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/announcements`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const handleCreatePost = async () => {
    if (newPost.title && newPost.content) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/announcements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newPost)
        });

        if (response.ok) {
          fetchAnnouncements(); // Refresh list
          setNewPost({ title: '', content: '' });
          setShowPostForm(false);
        }
      } catch (error) {
        console.error('Error creating announcement:', error);
      }
    }
  };

  const handleDeletePost = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchAnnouncements(); // Refresh list
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  // Fetch Users when tab is active
  React.useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/registrations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // User Management
  const handleApproveUser = async (id) => {
    try {
      const userToApprove = users.find(u => u.id === id);
      const type = userToApprove.type === 'delivery' ? 'deliveryagent' : 'seller';
      const token = localStorage.getItem('token');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/registration/${type}/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'approved' })
      });

      if (response.ok) {
        setUsers(users.map(u =>
          u.id === id ? { ...u, status: 'approved' } : u
        ));
        if (selectedUser && selectedUser.id === id) {
          setSelectedUser({ ...selectedUser, status: 'approved' });
        }
      } else {
        alert('Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };


  const handleRejectUser = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      try {
        const userToReject = users.find(u => u.id === id);
        const type = userToReject.type === 'delivery' ? 'deliveryagent' : 'seller';
        const token = localStorage.getItem('token');

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/registration/${type}/${id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'rejected', statusReason: reason })
        });

        if (response.ok) {
          setUsers(users.map(u =>
            u.id === id ? { ...u, status: 'rejected' } : u
          ));
          if (selectedUser && selectedUser.id === id) {
            setSelectedUser({ ...selectedUser, status: 'rejected' });
          }
        } else {
          alert('Failed to reject user');
        }
      } catch (error) {
        console.error('Error rejecting user:', error);
      }
    }
  };


  // Document Management
  const handleVerifyDocument = async (userId, docId) => {
    try {
      const user = users.find(u => u.id === userId);
      const type = user.type === 'delivery' ? 'deliveryagent' : 'seller';
      const token = localStorage.getItem('token');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/registration/${type}/${userId}/document/${docId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'verified' })
      });

      if (response.ok) {
        // Update local state deeply
        const updateDocs = (u) => ({
          ...u,
          documents: u.documents.map(doc =>
            doc.id === docId ? { ...doc, status: 'verified' } : doc
          )
        });

        setUsers(users.map(u => u.id === userId ? updateDocs(u) : u));

        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(updateDocs(selectedUser));
        }
      } else {
        alert('Failed to verify document');
      }
    } catch (error) {
      console.error('Error verifying document:', error);
    }
  };

  const handleRejectDocument = async (userId, docId) => {
    const reason = prompt('Enter rejection reason (optional):');
    // Note: Backend doesn't currently store doc rejection reason, but we can still proceed.

    try {
      const user = users.find(u => u.id === userId);
      const type = user.type === 'delivery' ? 'deliveryagent' : 'seller';
      const token = localStorage.getItem('token');

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/registration/${type}/${userId}/document/${docId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'rejected' })
      });

      if (response.ok) {
        const updateDocs = (u) => ({
          ...u,
          documents: u.documents.map(doc =>
            doc.id === docId ? { ...doc, status: 'rejected' } : doc
          )
        });

        setUsers(users.map(u => u.id === userId ? updateDocs(u) : u));

        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(updateDocs(selectedUser));
        }
      } else {
        alert('Failed to reject document');
      }
    } catch (error) {
      console.error('Error rejecting document:', error);
    }
  };

  // Administrator Management
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });

  // Fetch Administrators when tab is active
  React.useEffect(() => {
    if (activeTab === 'admins') {
      fetchAdministrators();
    }
  }, [activeTab]);

  const fetchAdministrators = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/Administrator`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAdministrators(data);
      }
    } catch (error) {
      console.error('Error fetching administrators:', error);
    }
  };

  const handleCreateAdmin = async () => {
    if (newAdmin.name && newAdmin.email && newAdmin.password) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/Administrator`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newAdmin)
        });

        if (response.ok) {
          fetchAdministrators(); // Refresh list
          setNewAdmin({ name: '', email: '', password: '' });
          setShowAdminForm(false);
        } else {
          const error = await response.json();
          alert(error.message || 'Failed to create administrator');
        }
      } catch (error) {
        console.error('Error creating administrator:', error);
        alert('Error creating administrator');
      }
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (confirm('Are you sure you want to delete this administrator?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/Administrator/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          fetchAdministrators(); // Refresh list
        }
      } catch (error) {
        console.error('Error deleting administrator:', error);
      }
    }
  };




  const handleViewDocument = (url, fileName) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      alert(`Document URL not found for ${fileName}`);
    }
  };

  // Chat Logic
  React.useEffect(() => {
    if (activeTab === 'chat') {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
          sender: user.email || 'Admin',
          role: 'Admin',
          message: newMessage
        })
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-green-500 p-2 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-red-600 transition"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex items-center gap-2 px-6 py-4 ${activeTab === 'posts'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <FileText className="w-5 h-5" />
              Post Management
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-6 py-4 ${activeTab === 'users'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <UserCheck className="w-5 h-5" />
              All Users
              {users.filter(u => u.status === 'pending').length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {users.filter(u => u.status === 'pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`flex items-center gap-2 px-6 py-4 ${activeTab === 'admins'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Users className="w-5 h-5" />
              Administrators
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-6 py-4 ${activeTab === 'chat'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <MessageSquare className="w-5 h-5" />
              Communication
            </button>
          </div>
        </div>

        {/* Post Management Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-gray-900">Announcements</h2>
              <button
                onClick={() => setShowPostForm(!showPostForm)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Plus className="w-5 h-5" />
                Create Post
              </button>
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    const welcomePost = {
                      title: "Welcome to FreshCart!",
                      content: "We are delighted to have you on board. Explore your dashboard to manage your activities efficiently."
                    };
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/announcements`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify(welcomePost)
                    });

                    if (response.ok) {
                      fetchAnnouncements(); // Refresh list
                    }
                  } catch (error) {
                    console.error('Error creating welcome announcement:', error);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ml-2"
              >
                <Plus className="w-5 h-5" />
                Post Welcome Message
              </button>
            </div>

            {showPostForm && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-900 mb-4">Create New Announcement</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter post title"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Content</label>
                    <textarea
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter post content"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCreatePost}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      Publish
                    </button>
                    <button
                      onClick={() => setShowPostForm(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post._id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-gray-900 mb-1">{post.title}</h3>
                      <p className="text-sm text-gray-500">{post.date} • {post.author}</p>
                    </div>
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-gray-700">{post.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Users Tab */}
        {activeTab === 'users' && !selectedUser && (
          <div className="space-y-6">
            <h2 className="text-gray-900">All Users</h2>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-gray-700">ID</th>
                    <th className="px-6 py-3 text-left text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-gray-700">Type</th>
                    <th className="px-6 py-3 text-left text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-gray-700">Phone</th>
                    <th className="px-6 py-3 text-left text-gray-700">Registration Date</th>
                    <th className="px-6 py-3 text-left text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-gray-700">Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((userProfile) => (
                    <tr
                      key={userProfile.id}
                      onClick={() => setSelectedUser(userProfile)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 text-gray-900">{userProfile.id}</td>
                      <td className="px-6 py-4 text-gray-900">{userProfile.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${userProfile.type === 'seller' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                          {userProfile.type === 'seller' ? 'Seller' : 'Delivery Agent'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{userProfile.email}</td>
                      <td className="px-6 py-4 text-gray-700">{userProfile.phone}</td>
                      <td className="px-6 py-4 text-gray-700">{userProfile.registrationDate}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${userProfile.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : userProfile.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {userProfile.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-700">{userProfile.documents.length} docs</span>
                        {userProfile.documents.filter(d => d.status === 'pending').length > 0 && (
                          <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {userProfile.documents.filter(d => d.status === 'pending').length} pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Details View */}
        {activeTab === 'users' && selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                ← Back to All Users
              </button>
              <h2 className="text-gray-900">{selectedUser.name} - Registration Details</h2>
            </div>

            {/* User Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-gray-900 mb-4">User Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">User ID</p>
                      <p className="text-gray-900">{selectedUser.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="text-gray-900">{selectedUser.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="text-gray-900">{selectedUser.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">User Type</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${selectedUser.type === 'seller' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                        {selectedUser.type === 'seller' ? 'Seller' : 'Delivery Agent'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Registration Date</p>
                      <p className="text-gray-900">{selectedUser.registrationDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={`px-2 py-1 rounded-full text-xs ${selectedUser.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : selectedUser.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {selectedUser.status}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedUser.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveUser(selectedUser.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve User
                    </button>
                    <button
                      onClick={() => handleRejectUser(selectedUser.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject User
                    </button>
                  </div>
                )}
              </div>

              {/* Seller Specific Details */}
              {selectedUser.type === 'seller' && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-gray-900 mb-4">Business Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Store Name</p>
                      <p className="text-gray-900">{selectedUser.storeName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Business Address</p>
                      <p className="text-gray-900">{selectedUser.businessAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <p className="text-gray-900">{selectedUser.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">GST Number</p>
                      <p className="text-gray-900">{selectedUser.gstNumber}</p>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 mt-4">Bank Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Account Holder</p>
                      <p className="text-gray-900">{selectedUser.bankAccountHolderName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Account Number</p>
                      <p className="text-gray-900">{selectedUser.bankAccountNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">IFSC Code</p>
                      <p className="text-gray-900">{selectedUser.ifscCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">UPI ID</p>
                      <p className="text-gray-900">{selectedUser.upiId || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Agent Specific Details */}
              {selectedUser.type === 'delivery' && (
                <div className="border-t pt-6 mt-6">
                  <h3 className="text-gray-900 mb-4">Delivery Agent Details</h3>

                  {/* Vehicle Details */}
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Vehicle Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                    <div>
                      <p className="text-sm text-gray-600">Vehicle Number</p>
                      <p className="text-gray-900">{selectedUser.vehicleNumber}</p>
                    </div>
                  </div>

                  {/* Address Details */}
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Address Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="md:col-span-3">
                      <p className="text-sm text-gray-600">Residential Address</p>
                      <p className="text-gray-900">{selectedUser.address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pin Code</p>
                      <p className="text-gray-900">{selectedUser.pinCode}</p>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Bank Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Account Holder</p>
                      <p className="text-gray-900">{selectedUser.accountHolderName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Account Number</p>
                      <p className="text-gray-900">{selectedUser.bankAccountNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">IFSC Code</p>
                      <p className="text-gray-900">{selectedUser.ifscCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">UPI ID</p>
                      <p className="text-gray-900">{selectedUser.upiId || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-gray-900 mb-4">Uploaded Documents</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-gray-700">Document Type</th>
                      <th className="px-6 py-3 text-left text-gray-700">File Name</th>
                      <th className="px-6 py-3 text-left text-gray-700">Upload Date</th>
                      <th className="px-6 py-3 text-left text-gray-700">Status</th>
                      <th className="px-6 py-3 text-left text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedUser.documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900">{doc.documentType}</td>
                        <td className="px-6 py-4 text-gray-700">{doc.fileName}</td>
                        <td className="px-6 py-4 text-gray-700">{doc.uploadDate}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${doc.status === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : doc.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {doc.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleVerifyDocument(selectedUser.id, doc.id)}
                                  className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                                  title="Verify Document"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRejectDocument(selectedUser.id, doc.id)}
                                  className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                                  title="Reject Document"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleViewDocument(doc.url, doc.fileName)}
                              className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                              title="View Document"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Administrators Tab */}
        {activeTab === 'admins' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-gray-900">Administrator Management</h2>
              <button
                onClick={() => setShowAdminForm(!showAdminForm)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Plus className="w-5 h-5" />
                Add Administrator
              </button>
            </div>

            {showAdminForm && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-900 mb-4">Create New Administrator</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={newAdmin.name}
                      onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    // Input remains same
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    // Input remains same
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-gray-700 mb-2">Password (Mock)</label>
                    <input
                      type="password"
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Enter temporary password"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <div className="flex gap-3">
                      <button
                        onClick={handleCreateAdmin}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        Create Admin
                      </button>
                      <button
                        onClick={() => setShowAdminForm(false)}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-gray-700">ID</th>
                    <th className="px-6 py-3 text-left text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-gray-700">Creation Date</th>
                    <th className="px-6 py-3 text-left text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {administrators.map((admin) => (
                    <tr key={admin._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900">{admin._id}</td>
                      <td className="px-6 py-4 text-gray-900">{admin.name}</td>
                      <td className="px-6 py-4 text-gray-700">{admin.email}</td>
                      <td className="px-6 py-4 text-gray-700">{new Date(admin.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteAdmin(admin._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Administrator"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-gray-900">Admin/Administrator Communication</h2>
              <p className="text-sm text-gray-500">Messages are auto-deleted after 7 days</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" id="chat-container">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.role === 'Admin' ? 'items-end' : 'items-start'
                    }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${msg.role === 'Admin'
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
      </div >
    </div >
  );
}

