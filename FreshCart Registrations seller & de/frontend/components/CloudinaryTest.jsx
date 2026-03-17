import React, { useState } from 'react';
import { uploadToCloudinary } from './utils/cloudinary';

const CloudinaryTest = () => {
  const [file, setFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    setLoading(true);
    try {
      const result = await uploadToCloudinary(file);
      setUploadResult(result);
      console.log('Upload successful:', result);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Cloudinary Test</h1>
      
      <div className="mb-6">
        <label className="block text-gray-700 mb-2">Select Image File:</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={loading || !file}
        className={`px-4 py-2 rounded-lg ${
          loading || !file
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? 'Uploading...' : 'Upload to Cloudinary'}
      </button>

      {uploadResult && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-xl font-semibold text-green-800 mb-2">Upload Successful!</h2>
          <p className="text-green-700 mb-4">Image uploaded to Cloudinary successfully.</p>
          
          <div className="mb-4">
            <h3 className="font-medium text-gray-700 mb-1">Image Preview:</h3>
            <img 
              src={uploadResult} 
              alt="Uploaded preview" 
              className="max-w-xs h-auto rounded border"
            />
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 mb-1">Image URL:</h3>
            <p className="text-sm text-gray-600 break-all">{uploadResult}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudinaryTest;