import { useState } from 'react';
import { Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

export default function RegistrationStatus() {
  const [searchValue, setSearchValue] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!searchValue.trim()) {
      setError('Please enter Registration ID or Email');
      return;
    }

    setLoading(true);
    try {
      const isEmail = searchValue.includes('@');
      const queryParam = isEmail ? `email=${encodeURIComponent(searchValue)}` : `id=${searchValue}`;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/registrations/status?${queryParam}`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch status');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-gray-900 mb-4">Check Registration Status</h1>
            <p className="text-gray-600">
              Enter your Registration ID or Email to check the status of your application
            </p>
          </div>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-4">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Enter Registration ID or Email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 opacity-90 disabled:opacity-50"
              >
                {loading ? 'Searching...' : <><Search className="w-5 h-5" /> Search</>}
              </button>
            </div>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {result && (
            <div className="border-t pt-8">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  {result.status === 'approved' && (
                    <>
                      <div className="bg-green-100 p-3 rounded-full">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-green-700">Application Approved</h2>
                        <p className="text-gray-600">
                          Congratulations! Your application has been approved.
                        </p>
                      </div>
                    </>
                  )}
                  {result.status === 'pending' && (
                    <>
                      <div className="bg-yellow-100 p-3 rounded-full">
                        <Clock className="w-8 h-8 text-yellow-600" />
                      </div>
                      <div>
                        <h2 className="text-yellow-700">Application Pending</h2>
                        <p className="text-gray-600">Your application is under review.</p>
                      </div>
                    </>
                  )}
                  {result.status === 'rejected' && (
                    <>
                      <div className="bg-red-100 p-3 rounded-full">
                        <XCircle className="w-8 h-8 text-red-600" />
                      </div>
                      <div>
                        <h2 className="text-red-700">Application Rejected</h2>
                        <p className="text-gray-600">
                          Unfortunately, your application was not approved.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Registration ID</p>
                    <p className="text-gray-900">{searchValue.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="text-gray-900 capitalize">
                      {result.type === 'seller' ? 'Seller Account' : 'Delivery Agent'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="text-gray-900">{result.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{result.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Submitted Date</p>
                    <p className="text-gray-900">{result.submittedDate}</p>
                  </div>
                  {result.reviewedDate && (
                    <div>
                      <p className="text-sm text-gray-500">Reviewed Date</p>
                      <p className="text-gray-900">{result.reviewedDate}</p>
                    </div>
                  )}
                </div>

                {result.status === 'approved' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
                    <h3 className="text-green-900 mb-2">Next Steps</h3>
                    <p className="text-green-800">
                      Your account is being set up and will be ready within 48 hours. You will
                      receive an email with login credentials and instructions to download the{' '}
                      {result.type === 'seller' ? 'Seller' : 'Delivery Agent'} app.
                    </p>
                  </div>
                )}

                {result.status === 'rejected' && result.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                    <h3 className="text-red-900 mb-2">Rejection Reason</h3>
                    <p className="text-red-800">{result.rejectionReason}</p>
                    <p className="text-red-700 mt-3">
                      You may reapply after addressing the issues mentioned above.
                    </p>
                  </div>
                )}

                {result.status === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                    <h3 className="text-yellow-900 mb-2">Review in Progress</h3>
                    <p className="text-yellow-800">
                      Our team is reviewing your application. This typically takes 2-5 business
                      days. You will receive an email notification once the review is complete.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Keep your registration ID safe. You'll need it to check your
              application status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
