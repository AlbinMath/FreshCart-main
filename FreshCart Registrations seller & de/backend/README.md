# FreshCart Backend

This is the backend API for the FreshCart Registration System, built with Node.js, Express, and MongoDB.

## Features

- User authentication (Admin and Administrator roles)
- Seller and Delivery Agent registration management
- Document upload with Cloudinary integration
- Admin dashboard APIs
- Administrator dashboard APIs
- Chat functionality between Admin and Administrator
- Announcement management

## Prerequisites

- Node.js (v14 or higher)
- MongoDB database
- Cloudinary account

## Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```
   cd backend
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```
# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Port Configuration
PORT=5000

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_URL=cloudinary://your_api_key:your_api_secret@your_cloud_name
```

## Running the Application

### Development Mode
```
npm run dev
```

### Production Mode
```
npm start
```

The server will start on port 5000 (or the port specified in your environment variables).

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Registrations
- `GET /api/registrations/status?phone=:phone` - Check registration status by phone

### Admin Routes
- `GET /api/admin/pending-registrations` - Get pending registrations
- `GET /api/admin/registration/:type/:id` - Get registration details
- `PATCH /api/admin/registration/:type/:id/status` - Update registration status
- `GET /api/admin/administrators` - Get all administrators
- `POST /api/admin/administrators` - Create new administrator
- `PATCH /api/admin/administrators/:id` - Update administrator
- `DELETE /api/admin/administrators/:id` - Delete administrator
- `POST /api/announcements` - Create announcement
- `GET /api/announcements` - Get announcements
- `DELETE /api/announcements/:id` - Delete announcement

### Administrator Routes
- `GET /api/administrator/sellers/approved` - Get approved sellers
- `PATCH /api/administrator/sellers/:id/confirm` - Confirm seller registration
- `GET /api/administrator/sellers/export` - Export approved sellers as CSV
- `GET /api/administrator/delivery-agents/approved` - Get approved delivery agents
- `PATCH /api/administrator/delivery-agents/:id/confirm` - Confirm delivery agent registration
- `GET /api/administrator/delivery-agents/export` - Export approved delivery agents as CSV
- `GET /api/chat/admin-admin` - Get chat messages
- `POST /api/chat/admin-admin` - Send chat message

## Models

- Admin - Admin users who can manage administrators and announcements
- Administrator - Users who can manage approved sellers and delivery agents
- Seller - Seller registration information
- Deliveryagent - Delivery agent registration information
- Announcement - Announcements for the platform
- AdminAdministratorCommunication - Chat messages between admins and administrators

## License

This project is licensed under the MIT License.