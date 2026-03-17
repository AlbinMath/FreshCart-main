// Cloudinary utility functions for image uploads

// Cloudinary configuration - using values from environment variables
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dune3hshk';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'freshcart_uploads';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Uploads a file to Cloudinary
 * @param {File} file - The file to upload
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
export const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload image');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to backend:', error);
    throw new Error('Failed to upload image: ' + error.message);
  }
};

/**
 * Handles multiple file uploads to Cloudinary
 * @param {Array<File>} files - Array of files to upload
 * @returns {Promise<Array<string>>} - Array of secure URLs
 */
export const uploadMultipleToCloudinary = async (files) => {
  try {
    const uploadPromises = files.map(file => uploadToCloudinary(file));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading multiple files to Cloudinary:', error);
    throw new Error('Failed to upload one or more images to Cloudinary: ' + error.message);
  }
};