import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Header from './Header';
import Footer from './Footer';
import { User, MapPin, IdCard, Bike, CreditCard, CheckCircle } from 'lucide-react';
import { uploadToCloudinary } from './utils/cloudinary';

const steps = [
  { id: 1, name: 'Personal Details', icon: User },
  { id: 2, name: 'Address & Location', icon: MapPin },
  { id: 3, name: 'Identity Verification', icon: IdCard },
  { id: 4, name: 'Vehicle Details', icon: Bike },
  { id: 5, name: 'Bank Details', icon: CreditCard },
];

export default function DeliveryAgentRegistration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [registrationId, setRegistrationId] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm();
  // State for file uploads
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploading, setUploading] = useState({});

  const handleFileChange = async (event, fieldName) => {
    const file = event.target.files[0];
    if (!file) return;

    // Set uploading state
    setUploading(prev => ({ ...prev, [fieldName]: true }));

    try {
      // Upload to Cloudinary
      const url = await uploadToCloudinary(file);

      // Save the URL in state
      setUploadedFiles(prev => ({ ...prev, [fieldName]: url }));

      // Show success message
      console.log(`${fieldName} uploaded successfully:`, url);
    } catch (error) {
      console.error(`Error uploading ${fieldName}:`, error);
      alert(`Failed to upload ${fieldName}. Please try again.`);
    } finally {
      // Reset uploading state
      setUploading(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const onSubmit = async (data) => {
    // Add uploaded file URLs to the form data
    const formDataWithImages = {
      ...data,
      ...uploadedFiles
    };

    console.log('Submitting registration:', formDataWithImages);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/registrations/delivery-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataWithImages),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Registration failed');
      }

      console.log('Registration successful:', result);
      setRegistrationId(result.registrationId || 'PENDING');
      setSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Registration failed: ' + error.message);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-gray-900 mb-4">Registration Submitted Successfully!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for joining Freshkart as a delivery partner. Your application is now under review.
            </p>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-600 mb-2">Your Registration ID</p>
              <p className="text-3xl text-orange-600">{registrationId}</p>
              <p className="text-sm text-gray-500 mt-2">Please save this ID to check your application status</p>
            </div>
            <div className="space-y-3">
              <p className="text-gray-700">What happens next?</p>
              <ul className="text-left space-y-2 text-gray-600">
                <li className="flex gap-2">
                  <span className="text-orange-600">•</span>
                  Our team will verify your documents within 2-5 business days
                </li>
                <li className="flex gap-2">
                  <span className="text-orange-600">•</span>
                  You'll receive an email notification about your application status
                </li>
                <li className="flex gap-2">
                  <span className="text-orange-600">•</span>
                  If approved, you can log in to the Delivery Agent app within 48 hours
                </li>
              </ul>
            </div>
            <div className="mt-8 flex gap-4 justify-center">
              <a href="/check-status" className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition">
                Check Status
              </a>
              <a href="/" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                Back to Home
              </a>
            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">


      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">Delivery Agent Registration</h1>
          <p className="text-gray-600">Join Freshkart and start earning with flexible delivery work</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCompleted ? 'bg-orange-600' : isActive ? 'bg-orange-600' : 'bg-gray-200'
                      }`}>
                      <Icon className={`w-6 h-6 ${isCompleted || isActive ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <p className={`text-sm mt-2 text-center hidden md:block ${isActive ? 'text-orange-600' : 'text-gray-500'}`}>
                      {step.name}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-1 flex-1 ${isCompleted ? 'bg-orange-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Step 1: Personal Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-gray-900 mb-6">Personal Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-2">Full Name *</label>
                    <input
                      {...register('fullName', { required: 'Full name is required' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter your full name"
                    />
                    {errors.fullName && <p className="text-red-600 text-sm mt-1">{errors.fullName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Date of Birth *</label>
                    <input
                      type="date"
                      {...register('dateOfBirth', { required: 'Date of birth is required' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {errors.dateOfBirth && <p className="text-red-600 text-sm mt-1">{errors.dateOfBirth.message}</p>}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Contact Number *</label>
                    <input
                      {...register('phone', {
                        required: 'Phone number is required',
                        pattern: { value: /^[0-9]{10}$/, message: 'Enter valid 10-digit phone number' }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter 10-digit phone number"
                    />
                    {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: { value: /^\S+@\S+$/i, message: 'Enter valid email' }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter email address"
                    />
                    {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Password *</label>
                    <input
                      type="password"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Password must be at least 8 characters' }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Create a password"
                    />
                    {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address & Location */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-gray-900 mb-6">Address & Location Details</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Residential Address *</label>
                    <textarea
                      {...register('address', { required: 'Address is required' })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Enter complete residential address"
                    />
                    {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 mb-2">City *</label>
                      <input
                        {...register('city', { required: 'City is required' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Enter city"
                      />
                      {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city.message}</p>}
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2">Pin Code *</label>
                      <input
                        {...register('pinCode', {
                          required: 'Pin code is required',
                          pattern: { value: /^[0-9]{6}$/, message: 'Enter valid 6-digit pin code' }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Enter 6-digit pin code"
                      />
                      {errors.pinCode && <p className="text-red-600 text-sm mt-1">{errors.pinCode.message}</p>}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Step 3: Identity Verification */}
            {
              currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-gray-900 mb-6">Identity Verification (KYC)</h2>

                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        Please upload clear, readable documents. All documents must be valid and not expired.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border border-gray-300 rounded-lg p-4">
                        <label className="block text-gray-700 mb-3">PAN Card *</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'panCard')}
                          className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                          disabled={uploading.panCard}
                        />
                        {uploading.panCard && (
                          <span className="text-sm text-orange-600">Uploading...</span>
                        )}
                        {uploadedFiles.panCard && (
                          <span className="text-sm text-green-600">✓ Uploaded</span>
                        )}
                        {uploadedFiles.panCard && (
                          <div className="mt-2">
                            <img
                              src={uploadedFiles.panCard}
                              alt="PAN Card preview"
                              className="w-16 h-16 object-cover rounded"
                            />
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Required for tax purposes</p>
                      </div>
                      <div className="border border-gray-300 rounded-lg p-4">
                        <label className="block text-gray-700 mb-3">Aadhaar Card *</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'aadhaar')}
                          className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                          disabled={uploading.aadhaar}
                        />
                        {uploading.aadhaar && (
                          <span className="text-sm text-orange-600">Uploading...</span>
                        )}
                        {uploadedFiles.aadhaar && (
                          <span className="text-sm text-green-600">✓ Uploaded</span>
                        )}
                        {uploadedFiles.aadhaar && (
                          <div className="mt-2">
                            <img
                              src={uploadedFiles.aadhaar}
                              alt="Aadhaar preview"
                              className="w-16 h-16 object-cover rounded"
                            />
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Upload front and back</p>
                      </div>

                      <div className="border border-gray-300 rounded-lg p-4">
                        <label className="block text-gray-700 mb-3">Voter ID / Passport (Alternative)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'voterId')}
                          className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                          disabled={uploading.voterId}
                        />
                        {uploading.voterId && (
                          <span className="text-sm text-orange-600">Uploading...</span>
                        )}
                        {uploadedFiles.voterId && (
                          <span className="text-sm text-green-600">✓ Uploaded</span>
                        )}
                        {uploadedFiles.voterId && (
                          <div className="mt-2">
                            <img
                              src={uploadedFiles.voterId}
                              alt="Voter ID preview"
                              className="w-16 h-16 object-cover rounded"
                            />
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Optional if Aadhaar provided</p>
                      </div>

                      <div className="border border-gray-300 rounded-lg p-4">
                        <label className="block text-gray-700 mb-3">Passport Size Photo *</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'photo')}
                          className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                          disabled={uploading.photo}
                        />
                        {uploading.photo && (
                          <span className="text-sm text-orange-600">Uploading...</span>
                        )}
                        {uploadedFiles.photo && (
                          <span className="text-sm text-green-600">✓ Uploaded</span>
                        )}
                        {uploadedFiles.photo && (
                          <div className="mt-2">
                            <img
                              src={uploadedFiles.photo}
                              alt="Photo preview"
                              className="w-16 h-16 object-cover rounded"
                            />
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Recent photograph</p>
                      </div>

                      <div className="border border-gray-300 rounded-lg p-4">
                        <label className="block text-gray-700 mb-3">Address Proof</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'addressProof')}
                          className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                          disabled={uploading.addressProof}
                        />
                        {uploading.addressProof && (
                          <span className="text-sm text-orange-600">Uploading...</span>
                        )}
                        {uploadedFiles.addressProof && (
                          <span className="text-sm text-green-600">✓ Uploaded</span>
                        )}
                        {uploadedFiles.addressProof && (
                          <div className="mt-2">
                            <img
                              src={uploadedFiles.addressProof}
                              alt="Address proof preview"
                              className="w-16 h-16 object-cover rounded"
                            />
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Utility bill or rent agreement</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }

            {/* Step 4: Vehicle Details */}
            {
              currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-gray-900 mb-6">Vehicle Details</h2>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-700 mb-2">Type of Vehicle *</label>
                        <select
                          {...register('vehicleType', { required: 'Vehicle type is required' })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">Select vehicle type</option>
                          <option value="bicycle">Bicycle</option>
                          <option value="scooter">Scooter/Moped</option>
                          <option value="motorcycle">Motorcycle</option>
                          <option value="car">Car</option>
                        </select>
                        {errors.vehicleType && <p className="text-red-600 text-sm mt-1">{errors.vehicleType.message}</p>}
                      </div>

                      <div>
                        <label className="block text-gray-700 mb-2">Registration Number *</label>
                        <input
                          {...register('registrationNumber', { required: 'Registration number is required' })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="e.g., DL01AB1234"
                        />
                        {errors.registrationNumber && <p className="text-red-600 text-sm mt-1">{errors.registrationNumber.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="border border-gray-300 rounded-lg p-4">
                        <label className="block text-gray-700 mb-3">RC Book (Registration Certificate) *</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'rcBook')}
                          className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                          disabled={uploading.rcBook}
                        />
                        {uploading.rcBook && (
                          <span className="text-sm text-orange-600">Uploading...</span>
                        )}
                        {uploadedFiles.rcBook && (
                          <span className="text-sm text-green-600">✓ Uploaded</span>
                        )}
                        {uploadedFiles.rcBook && (
                          <div className="mt-2">
                            <img
                              src={uploadedFiles.rcBook}
                              alt="RC Book preview"
                              className="w-16 h-16 object-cover rounded"
                            />
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Clear copy of RC book</p>
                      </div>

                      <div className="border border-gray-300 rounded-lg p-4">
                        <label className="block text-gray-700 mb-3">Driving License *</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'drivingLicense')}
                          className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                          disabled={uploading.drivingLicense}
                        />
                        {uploading.drivingLicense && (
                          <span className="text-sm text-orange-600">Uploading...</span>
                        )}
                        {uploadedFiles.drivingLicense && (
                          <span className="text-sm text-green-600">✓ Uploaded</span>
                        )}
                        {uploadedFiles.drivingLicense && (
                          <div className="mt-2">
                            <img
                              src={uploadedFiles.drivingLicense}
                              alt="Driving license preview"
                              className="w-16 h-16 object-cover rounded"
                            />
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Valid driving license</p>
                      </div>

                      <div className="border border-gray-300 rounded-lg p-4">
                        <label className="block text-gray-700 mb-3">Vehicle Insurance *</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'vehicleInsurance')}
                          className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                          disabled={uploading.vehicleInsurance}
                        />
                        {uploading.vehicleInsurance && (
                          <span className="text-sm text-orange-600">Uploading...</span>
                        )}
                        {uploadedFiles.vehicleInsurance && (
                          <span className="text-sm text-green-600">✓ Uploaded</span>
                        )}
                        {uploadedFiles.vehicleInsurance && (
                          <div className="mt-2">
                            <img
                              src={uploadedFiles.vehicleInsurance}
                              alt="Vehicle insurance preview"
                              className="w-16 h-16 object-cover rounded"
                            />
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Valid insurance certificate</p>
                      </div>

                      <div className="border border-gray-300 rounded-lg p-4">
                        <label className="block text-gray-700 mb-3">Vehicle Photo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, 'vehiclePhoto')}
                          className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                          disabled={uploading.vehiclePhoto}
                        />
                        {uploading.vehiclePhoto && (
                          <span className="text-sm text-orange-600">Uploading...</span>
                        )}
                        {uploadedFiles.vehiclePhoto && (
                          <span className="text-sm text-green-600">✓ Uploaded</span>
                        )}
                        {uploadedFiles.vehiclePhoto && (
                          <div className="mt-2">
                            <img
                              src={uploadedFiles.vehiclePhoto}
                              alt="Vehicle photo preview"
                              className="w-16 h-16 object-cover rounded"
                            />
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Photo of your vehicle</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }

            {/* Step 5: Bank Details */}
            {
              currentStep === 5 && (
                <div className="space-y-6">
                  <h2 className="text-gray-900 mb-6">Bank / Payment Details</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 mb-2">Account Holder Name *</label>
                      <input
                        {...register('accountHolder', { required: 'Account holder name is required' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Enter account holder name"
                      />
                      {errors.accountHolder && <p className="text-red-600 text-sm mt-1">{errors.accountHolder.message}</p>}
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2">Bank Account Number *</label>
                      <input
                        {...register('accountNumber', { required: 'Account number is required' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Enter account number"
                      />
                      {errors.accountNumber && <p className="text-red-600 text-sm mt-1">{errors.accountNumber.message}</p>}
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-2">IFSC Code *</label>
                      <input
                        {...register('ifscCode', {
                          required: 'IFSC code is required',
                          pattern: { value: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: 'Enter valid IFSC code' }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Enter IFSC code"
                      />
                      {errors.ifscCode && <p className="text-red-600 text-sm mt-1">{errors.ifscCode.message}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-gray-700 mb-2">UPI ID (Optional)</label>
                      <input
                        {...register('upiId')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="Enter UPI ID (e.g., name@upi)"
                      />
                    </div>

                    <div className="md:col-span-2 border border-gray-300 rounded-lg p-4">
                      <label className="block text-gray-700 mb-3">Cancelled Cheque / Bank Statement</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'bankStatement')}
                        className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                        disabled={uploading.bankStatement}
                      />
                      {uploading.bankStatement && (
                        <span className="text-sm text-orange-600">Uploading...</span>
                      )}
                      {uploadedFiles.bankStatement && (
                        <span className="text-sm text-green-600">✓ Uploaded</span>
                      )}
                      {uploadedFiles.bankStatement && (
                        <div className="mt-2">
                          <img
                            src={uploadedFiles.bankStatement}
                            alt="Bank statement preview"
                            className="w-16 h-16 object-cover rounded"
                          />
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">For bank account verification</p>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-green-900 mb-2">Benefits of Joining Freshkart</h3>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Flexible working hours - work when you want</li>
                      <li>• Competitive earnings with performance bonuses</li>
                      <li>• Weekly payouts directly to your bank account</li>
                      <li>• Insurance coverage during deliveries</li>
                    </ul>
                  </div>
                </div>
              )
            }

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={prevStep}
                className={`px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition ${currentStep === 1 ? 'invisible' : ''
                  }`}
              >
                Previous
              </button>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                >
                  Submit Application
                </button>
              )}
            </div>
          </div >
        </form >
      </div >


    </div >
  );
}
