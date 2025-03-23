const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config(); // Load environment variables
const admin = require('./firebase'); // Import Firebase Admin SDK
const registeredUsersRouter = require('./routes/registeredUsersRouter');
const confirmedPsoRouter = require('./routes/confirmedPsoRouter');
const confirmedPPRouter = require('./routes/confirmedPPRouter');
const livePPRouter = require('./routes/livePPRouter');
const fcmTokenRouter = require('./routes/AdminFCMTokenRouter'); // Adjust the path as needed
const leaveApprovalRoutes = require('./routes/leaveApprovalRouter');
const notificationRouter = require('./routes/notificationRouter'); // Import Notification Router
const LivePPModel = require('./models/livePPModel'); // Import the LivePP model
const FCMToken = require('./models/AdminFCMTokenModel'); // Adjust the path as needed
const RegisteredUsersModel = require('./models/registeredUsersModel'); // Import the RegisteredUsers model
const Notification = require('./models/notificationModel'); // Import the Notification model
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api', registeredUsersRouter);
app.use('/apis', confirmedPsoRouter);
app.use('/', confirmedPPRouter);
app.use('/apk', livePPRouter);
app.use('/api/leave', leaveApprovalRoutes);
app.use('/api', notificationRouter); // Use the Notification Router
app.use('/api/fcm-tokens', fcmTokenRouter);
// In-memory store for user locations and logging timers
const userLocations = {};
const notificationTimestamps = {}; // Store timestamps of last notifications sent
const locationUpdateTimestamps = {}; // Store timestamps of the last location updates

// Haversine formula to calculate distance between two points in meters
const haversineDistance = (coords1, coords2) => {
    const toRad = (angle) => angle * (Math.PI / 180);

    const lat1 = coords1.latitude;
    const lon1 = coords1.longitude;
    const lat2 = coords2.latitude;
    const lon2 = coords2.longitude;

    const R = 6371000; // Radius of the Earth in meters

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
};

// Function to send FCM notification and save it in the database
const sendNotification = async (userId, title, body, psoName, ppName) => {
    try {
        // Find the specific user's token
        const user = await RegisteredUsersModel.findOne({ beltNumber: userId });
        if (!user || !user.fcmToken) {
            console.error(`FCM token for user ID ${userId} not found`);
        }

        // Fetch all FCM tokens from the database
        const allTokens = await FCMToken.find({}, 'fcmToken');

        // Combine the user's token (if exists) with all tokens from the database
        const tokensToNotify = new Set([
            ...(user && user.fcmToken ? [user.fcmToken] : []),
            ...allTokens.map(token => token.fcmToken)
        ]);

        // Prepare the message
        const message = {
            notification: {
                title,
                body
            }
        };

        // Send notifications to all tokens
        for (const token of tokensToNotify) {
            try {
                const response = await admin.messaging().send({ ...message, token });
                console.log('Successfully sent message:', response);
            } catch (error) {
                console.error('Error sending message to token:', token, error);
            }
        }

        // Save the notification to the database
        const date = new Date().toLocaleDateString('en-GB'); // Format: dd/mm/yyyy
        const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }); // Format: 3pm or 7am
        const notification = new Notification({
            psoName,
            ppName,
            date,
            time,
            message: body // change the title of notification saved in database
        });
        await notification.save();
        console.log('Notification saved to database');
    } catch (error) {
        console.error('Error sending messages or saving notification:', error);
    }
};

// Function to log if distance is greater than or equal to the radius, throttled to once per minute
const logDistanceCheck = async (pp, pso, distance) => {
    console.log(`Radius for PP (ID: ${pp.beltNumber}) and PSO (ID: ${pso.id}): ${pp.radius} meters`);
    const logKey = `${pp.beltNumber}-${pso.id}`;
    const result = distance >= pp.radius;
    console.log(`Initial distance check for PP (ID: ${pp.beltNumber}) and PSO (ID: ${pso.id}): ${result}`);

    if (result) {
        const now = Date.now();
        const lastNotification = notificationTimestamps[logKey] || 0;

        // Check if 1 minute has passed since the last notification
        if (now - lastNotification > 60000) {
            const psoUser = await RegisteredUsersModel.findOne({ beltNumber: pso.id });
            const ppUser = await RegisteredUsersModel.findOne({ beltNumber: pp.beltNumber });
            const psoName = psoUser ? psoUser.name : 'Unknown PSO';
            const ppName = ppUser ? ppUser.name : 'Unknown PP';

            sendNotification(pso.id, 'Out of Radius Alert', 'You are out of the designated radius.', psoName, ppName);
            notificationTimestamps[logKey] = now;
        }
    }
};

// Function to periodically check for location updates
const checkLocationUpdates = async () => {
    const now = Date.now();
    for (const userId in locationUpdateTimestamps) {
        if (locationUpdateTimestamps.hasOwnProperty(userId)) {
            const lastUpdate = locationUpdateTimestamps[userId];
            if (now - lastUpdate > 60000) { // 1 minute
                try {
                    // Fetch user information from RegisteredUsersModel
                    const user = await RegisteredUsersModel.findOne({ beltNumber: userId });
                    if (!user) {
                        console.log(`User with ID ${userId} not found in RegisteredUsers.`);
                        continue;
                    }

                    let userName = user.name;
                    let notificationBody = '';
                    let ppName = '';

                    // Check if the user is a PP
                    const livePP = await LivePPModel.findOne({ beltNumber: userId });

                    if (livePP && livePP.assignedPSOs.length > 0) {
                        // User is a PP with assigned PSOs
                        notificationBody = `PP ${userName}, are not sending location updates.`;
                         await sendNotification(userId, 'Location Update Alert', notificationBody, userName, '');
                         locationUpdateTimestamps[userId] = now;
                        console.log(`PP ${userName} (ID: ${userId}) with assigned PSOs hasn't updated location for over 1 minute.`);
                    } else {
                        // Check if the user is an assigned PSO
                        const assignedPP = await LivePPModel.findOne({ "assignedPSOs.id": userId });
                        if (assignedPP) {
                            const pp = await RegisteredUsersModel.findOne({ beltNumber: assignedPP.beltNumber });
                            ppName = pp ? pp.name : 'Unknown PP';
                            notificationBody = `PSO ${userName}, are not sending location updates.`;
                             await sendNotification(userId, 'Location Update Alert', notificationBody, userName, '');
                             locationUpdateTimestamps[userId] = now;
                            console.log(`PSO ${userName} (ID: ${userId}) assigned to PP ${ppName} hasn't updated location for over 1 minute.`);
                        } else {
                            console.log(`User ${userName} (ID: ${userId}) is neither an assigned PSO nor a PP with assigned PSOs.`);
                            continue; // Skip sending notification for unassigned users
                        }
                    }
                } catch (error) {
                    console.error(`Error processing location update for user ${userId}:`, error);
                }
            }
        }
    }
};

// Set an interval to check for location updates every minute
setInterval(checkLocationUpdates, 60000);
// Socket.IO
io.on('connect', (socket) => {
    console.log('New User connected');

    socket.on('sendLocation', async (location) => {
        console.log(`Received location:`, location);

        const { userId, latitude, longitude } = location; // Extract userId and coordinates from the location object
        userLocations[userId] = { latitude, longitude }; // Store the user's location
        locationUpdateTimestamps[userId] = Date.now(); // Update the timestamp for the user's location

        try {
            const pp = await LivePPModel.findOne({ beltNumber: userId }); // Check if the user is a PP

            if (pp) {
                console.log(`User with ID ${userId} is a PP.`);
                // Check distance to each assigned PSO
                pp.assignedPSOs.forEach(async pso => {
                    if (userLocations[pso.id]) {
                        const distance = haversineDistance(location, userLocations[pso.id]);
                        console.log(`Distance between PP (ID: ${userId}) and PSO (ID: ${pso.id}): ${distance.toFixed(2)} meters`);
                        await logDistanceCheck(pp, pso, distance);
                    } else {
                        console.log(`Location for PSO (ID: ${pso.id}) not available.`);
                    }
                });
            } else {
                // Check if the user is an assigned PSO
                const livePPs = await LivePPModel.find({ "assignedPSOs.id": userId });

                if (livePPs.length > 0) {
                    const livePP = livePPs[0];
                    const ppBeltNumber = livePP.beltNumber;
                    console.log(`User with ID ${userId} is an assigned PSO to PP with belt number ${ppBeltNumber}.`);

                    if (userLocations[ppBeltNumber]) {
                        const distance = haversineDistance(location, userLocations[ppBeltNumber]);
                        console.log(`Distance between PSO (ID: ${userId}) and PP (ID: ${ppBeltNumber}): ${distance.toFixed(2)} meters`);
                        await logDistanceCheck(livePP, { id: userId }, distance);
                    } else {
                        console.log(`Location for PP (ID: ${ppBeltNumber}) not available.`);
                    }
                } else {
                    console.log(`User with ID ${userId} is not a PP or an assigned PSO.`);
                }
            }

            io.emit('receiveLocation', location);

        } catch (err) {
            console.error('Error checking user status:', err);
        }
    });

    // Handle the client disconnecting
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});