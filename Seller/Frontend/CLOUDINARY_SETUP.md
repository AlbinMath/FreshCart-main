# Cloudinary Setup Instructions

This document explains how to set up Cloudinary for image uploads in the FreshCart project.

## Prerequisites

1. A Cloudinary account (sign up at https://cloudinary.com/)
2. Cloudinary cloud name, API key, and API secret
3. An upload preset configured in your Cloudinary account

## Setup Steps

### 1. Create an Upload Preset

1. Log in to your Cloudinary dashboard
2. Navigate to Settings > Upload
3. Scroll down to "Upload presets" section
4. Click "Add upload preset"
5. Configure the preset with the following settings:
   - Name: `freshcart_uploads` (optional)
   - Signing Mode: Unsigned
   - Folder: `freshcart_uploads` (optional)
   - Other settings can be left as default or customized as needed

### 2. Update Environment Variables

Ensure your `.env` files have the correct Cloudinary configuration:

In `frontend/.env`:
```
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=freshcart_uploads
```

In `backend/.env`:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name
```

### 3. Testing the Integration

1. Start the frontend application
2. Navigate to the CloudinaryTest component to verify uploads work
3. Try uploading an image and confirm it appears in your Cloudinary dashboard

## How It Works

The image upload functionality uses the following approach:

1. Files are selected by users through file input elements
2. When a file is selected, it's immediately uploaded to Cloudinary
3. Cloudinary returns a secure URL for the uploaded image
4. The URL is stored in component state and associated with the form field
5. When the form is submitted, the image URLs are included with the form data

## Security Notes

- The frontend uses an unsigned upload preset, which is appropriate for client-side uploads
- Never expose your Cloudinary API secret in frontend code
- For production applications, consider implementing signed uploads for better security
- Validate file types and sizes both on the client and server sides

## Troubleshooting

If you encounter issues with image uploads:

1. Verify your upload preset name matches `freshcart_uploads`
2. Check that the preset is set to "Unsigned"
3. Ensure your Cloudinary account is active and not over quota
4. Confirm your environment variables are correctly set
5. Check the browser console for any error messages