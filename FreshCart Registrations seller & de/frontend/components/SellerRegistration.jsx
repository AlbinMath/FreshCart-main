import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Header from './Header';
import Footer from './Footer';
import { Store, Building, MapPin, CreditCard, Package, Upload, CheckCircle } from 'lucide-react';
import { uploadToCloudinary } from './utils/cloudinary';

const steps = [
  { id: 1, name: 'Basic Information', icon: Store },
  { id: 2, name: 'Business Details', icon: Building },
  { id: 3, name: 'Address & Delivery', icon: MapPin },
  { id: 4, name: 'Bank Details', icon: CreditCard },
  { id: 5, name: 'Quality & Documents', icon: Package },
];

const productCategories = [
  'Fresh Vegetables',
  'Fresh Fruits',
  'Dairy Products',
  'Meat & Poultry',
  'Seafood',
  'Others'
];

const requiredDocuments = [
  { name: 'ID Proof (Aadhaar)', id: 'idProof' },
  { name: 'GST Certificate', id: 'gst' },
  { name: 'Ownership Proof', id: 'ownership' },
  { name: 'Bank Account Proof', id: 'bankProof' },
  { name: 'Owner Photo', id: 'photo' },
  { name: 'Shop/Warehouse Photo', id: 'shopPhoto' },
  { name: 'FSSAI License', id: 'fssai' }
];

export default function SellerRegistration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [registrationId, setRegistrationId] = useState('');
  const { register, handleSubmit, formState: { errors }, watch, trigger } = useForm();
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

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate = [];

    // Define fields to validate for each step
    switch (currentStep) {
      case 1: // Basic Information
        fieldsToValidate = ['sellerName', 'contactPerson', 'phone', 'email', 'password', 'businessType'];
        break;
      case 2: // Business Details
        fieldsToValidate = ['storeName', 'fssaiLicense', 'productCategory', 'openingTime', 'closingTime'];
        break;
      case 3: // Address & Delivery
        fieldsToValidate = ['address', 'pinCode', 'deliveryMethod'];
        break;
      case 4: // Bank Details
        fieldsToValidate = ['accountHolder', 'accountNumber', 'ifscCode', 'panNumber'];
        break;
      case 5: // Quality & Documents (This is usually submitted via onSubmit, but just in case)
        fieldsToValidate = ['packagingProcess', 'storageDetails'];
        break;
      default:
        break;
    }

    // Trigger validation for the specific fields
    const isValid = await trigger(fieldsToValidate);

    if (isValid) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const onSubmit = async (data) => {
    // Validate that all required documents are uploaded
    const missingDocs = requiredDocuments.filter(doc => !uploadedFiles[doc.id]);

    if (missingDocs.length > 0) {
      alert(`Please upload all mandatory documents: ${missingDocs.map(d => d.name).join(', ')}`);
      return;
    }

    // Add uploaded file URLs to the form data
    const formDataWithImages = {
      ...data,
      ...uploadedFiles
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/registrations/seller`, {
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
              Thank you for registering with Freshkart. Your application is now under review.
            </p>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-sm text-gray-600 mb-2">Your Registration ID</p>
              <p className="text-3xl text-green-600">{registrationId}</p>
              <p className="text-sm text-gray-500 mt-2">
                Please save this ID to check your application status
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-gray-700">What happens next?</p>
              <ul className="text-left space-y-2 text-gray-600">
                <li className="flex gap-2">
                  <span className="text-green-600">•</span>
                  Our team will review your application within 2-5 business days
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">•</span>
                  You'll receive an email notification about your application status
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">•</span>
                  If approved, you can log in to the Seller app within 48 hours
                </li>
              </ul>
            </div>
            <div className="mt-8 flex gap-4 justify-center">
              <a
                href="/check-status"
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Check Status
              </a>
              <a
                href="/"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
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
          <h1 className="text-gray-900 mb-2">Seller Account Registration</h1>
          <p className="text-gray-600">
            Join Freshkart and start selling fresh products to customers in your area
          </p>
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
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-600' : isActive ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${isCompleted || isActive ? 'text-white' : 'text-gray-500'
                          }`}
                      />
                    </div>
                    <p
                      className={`text-sm mt-2 text-center hidden md:block ${isActive ? 'text-green-600' : 'text-gray-500'
                        }`}
                    >
                      {step.name}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-1 flex-1 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-gray-900 mb-6">Basic Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Seller Name *</label>
                    <input
                      {...register('sellerName', { required: 'Seller name is required' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter seller/business name"
                    />
                    {errors.sellerName && (
                      <p className="text-red-600 text-sm mt-1">{errors.sellerName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Contact Person *</label>
                    <input
                      {...register('contactPerson', { required: 'Contact person is required' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter contact person name"
                    />
                    {errors.contactPerson && (
                      <p className="text-red-600 text-sm mt-1">{errors.contactPerson.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Phone Number *</label>
                    <input
                      {...register('phone', {
                        required: 'Phone number is required',
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: 'Enter valid 10-digit phone number'
                        }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter 10-digit phone number"
                    />
                    {errors.phone && (
                      <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: { value: /^\S+@\S+$/i, message: 'Enter valid email' }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Password *</label>
                    <input
                      type="password"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Password must be at least 8 characters' }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Create a password"
                    />
                    {errors.password && (
                      <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Business Type *</label>
                    <select
                      {...register('businessType', { required: 'Business type is required' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select business type</option>
                      <option value="individual">Individual Seller</option>
                      <option value="partnership">Partnership</option>
                    </select>
                    {errors.businessType && (
                      <p className="text-red-600 text-sm mt-1">{errors.businessType.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Business Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-gray-900 mb-6">Business & Store Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Store/Business Name *</label>
                    <input
                      {...register('storeName', { required: 'Store name is required' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter store name"
                    />
                    {errors.storeName && (
                      <p className="text-red-600 text-sm mt-1">{errors.storeName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">GST Number (Optional)</label>
                    <input
                      {...register('gstNumber')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter GST number if applicable"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">FSSAI License Number *</label>
                    <input
                      {...register('fssaiLicense', {
                        required: 'FSSAI license is required'
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter FSSAI License Number"
                    />
                    {errors.fssaiLicense && (
                      <p className="text-red-600 text-sm mt-1">{errors.fssaiLicense.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Product Categories *</label>
                    <div className="border border-gray-300 rounded-lg p-4 max-h-40 overflow-y-auto">
                      {productCategories.map((category) => (
                        <label key={category} className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            value={category}
                            {...register('productCategory', {
                              required: 'Select at least one category'
                            })}
                            className="rounded text-green-600 focus:ring-green-500"
                          />
                          <span className="text-gray-700">{category}</span>
                        </label>
                      ))}
                    </div>
                    {errors.productCategory && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.productCategory.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Opening Time *</label>
                    <input
                      type="time"
                      {...register('openingTime', { required: 'Opening time is required' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {errors.openingTime && (
                      <p className="text-red-600 text-sm mt-1">{errors.openingTime.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Closing Time *</label>
                    <input
                      type="time"
                      {...register('closingTime', { required: 'Closing time is required' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {errors.closingTime && (
                      <p className="text-red-600 text-sm mt-1">{errors.closingTime.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Address & Delivery */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-gray-900 mb-6">Address & Delivery Details</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Store/Warehouse Address *</label>
                    <textarea
                      {...register('address', { required: 'Address is required' })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter complete address"
                    />
                    {errors.address && (
                      <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 mb-2">Pin Code *</label>
                      <input
                        {...register('pinCode', {
                          required: 'Pin code is required',
                          pattern: {
                            value: /^[0-9]{6}$/,
                            message: 'Enter valid 6-digit pin code'
                          }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter 6-digit pin code"
                      />
                      {errors.pinCode && (
                        <p className="text-red-600 text-sm mt-1">{errors.pinCode.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-gray-700 mb-2">Delivery Method *</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            value="self"
                            {...register('deliveryMethod', {
                              required: 'Delivery method is required'
                            })}
                            className="text-green-600 focus:ring-green-500"
                          />
                          <span className="text-gray-700">
                            Self Delivery - I will handle delivery myself
                          </span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            value="platform"
                            {...register('deliveryMethod', {
                              required: 'Delivery method is required'
                            })}
                            className="text-green-600 focus:ring-green-500"
                          />
                          <span className="text-gray-700">
                            Platform Delivery - Use Freshkart delivery agents
                          </span>
                        </label>
                      </div>
                      {errors.deliveryMethod && (
                        <p className="text-red-600 text-sm mt-1">{errors.deliveryMethod.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Bank Details */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-gray-900 mb-6">Bank & Payment Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Account Holder Name *</label>
                    <input
                      {...register('accountHolder', { required: 'Account holder name is required' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter account holder name"
                    />
                    {errors.accountHolder && (
                      <p className="text-red-600 text-sm mt-1">{errors.accountHolder.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Bank Account Number *</label>
                    <input
                      {...register('accountNumber', { required: 'Account number is required' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter account number"
                    />
                    {errors.accountNumber && (
                      <p className="text-red-600 text-sm mt-1">{errors.accountNumber.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">IFSC Code *</label>
                    <input
                      {...register('ifscCode', {
                        required: 'IFSC code is required',
                        pattern: {
                          value: /^[A-Z]{4}0[A-Z0-9]{6}$/,
                          message: 'Enter valid IFSC code'
                        }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter IFSC code"
                    />
                    {errors.ifscCode && (
                      <p className="text-red-600 text-sm mt-1">{errors.ifscCode.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">UPI ID (Optional)</label>
                    <input
                      {...register('upiId')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter UPI ID"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-gray-700 mb-2">PAN Number *</label>
                    <input
                      {...register('panNumber', {
                        required: 'PAN number is required',
                        pattern: {
                          value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                          message: 'Enter valid PAN number'
                        }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter PAN number"
                    />
                    {errors.panNumber && (
                      <p className="text-red-600 text-sm mt-1">{errors.panNumber.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Quality & Documents */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-gray-900 mb-6">Quality Verification & Documents</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 mb-2">Packaging Process Details *</label>
                    <textarea
                      {...register('packagingProcess', {
                        required: 'Packaging details are required'
                      })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Describe your packaging process"
                    />
                    {errors.packagingProcess && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.packagingProcess.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      Storage/Refrigeration Details *
                    </label>
                    <textarea
                      {...register('storageDetails', {
                        required: 'Storage details are required'
                      })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Describe your storage facilities"
                    />
                    {errors.storageDetails && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.storageDetails.message}
                      </p>
                    )}
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-gray-900 mb-4">Document Uploads (All Mandatory)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {requiredDocuments.map((doc) => (
                        <div key={doc.id} className="border border-gray-300 rounded-lg p-4">
                          <label className="block text-gray-700 mb-2">
                            {doc.name} <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileChange(e, doc.id)}
                              className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                              disabled={uploading[doc.id]}
                            />
                            {uploading[doc.id] && (
                              <span className="text-sm text-green-600">Uploading...</span>
                            )}
                            {uploadedFiles[doc.id] && (
                              <span className="text-sm text-green-600">✓ Uploaded</span>
                            )}
                          </div>
                          {uploadedFiles[doc.id] && (
                            <div className="mt-2">
                              <img
                                src={uploadedFiles[doc.id]}
                                alt={`${doc.name} preview`}
                                className="w-16 h-16 object-cover rounded"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> All documents should be clear and readable. Supported
                      formats: JPG, PNG, PDF. Maximum file size: 5MB per document.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Submit Application
                </button>
              )}
            </div>
          </div>
        </form>
      </div>


    </div>
  );
}
