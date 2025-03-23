# Police Project Server

A Node.js server application for tracking police personnel locations and managing notifications.

## Setup Instructions

### Prerequisites
- Node.js (v12 or higher)
- MongoDB Atlas account

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Rename `.env.example` to `.env` (or create a new `.env` file)
   - Update the MongoDB connection string in the `.env` file:
     ```
     MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@clusterpolice.haoqg.mongodb.net/?retryWrites=true&w=majority&appName=ClusterPolice
     ```
   - Replace `YOUR_USERNAME` and `YOUR_PASSWORD` with your actual MongoDB Atlas credentials

4. Start the server:
   ```
   node index.js
   ```

## MongoDB Connection Issues

If you encounter authentication errors when connecting to MongoDB:

1. Verify your MongoDB Atlas username and password
2. Make sure your IP address is whitelisted in the MongoDB Atlas dashboard
3. Check if your MongoDB Atlas cluster is active
4. Ensure your database user has the appropriate permissions

## Features

- Real-time location tracking
- Out-of-radius notifications
- User management for police personnel
- Leave approval system
- Push notifications via Firebase Cloud Messaging (FCM) 