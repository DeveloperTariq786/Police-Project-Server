const mongoose = require('mongoose');
const admin = require('../firebase'); // Ensure you have the Firebase Admin SDK setup
const cron = require('node-cron'); // Import node-cron
const RegisteredUser = require('./registeredUsersModel'); // Import the RegisteredUser model
const LivePPModel = require('./livePPModel'); // Import the LivePP model
const ConfirmedPso = require('./confirmedPsoModel'); // Import the ConfirmedPso model

const LeaveApprovalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    beltNumber: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    appliedDate: {
        type: Date,
        required: true,
    },
    isApproved: {
        type: Boolean,
        default: false,
    },
    isDenied: {
        type: Boolean,
        default: false,
    },
    reqextension: {
        type: Boolean,
        default: false,
    },
    reqresumption: {
        type: Boolean,
        default: false,
    },
    extension: {
        type: Boolean,
        default: false,
    },
    resumption: {
        type: Boolean,
        default: false,
    },
    extensionDate: {
        type: Date,
        default: null,
    },
    resumptionDate: {
        type: Date,
        default: null,
    }
});

LeaveApprovalSchema.index({ beltNumber: 1, startDate: 1 }, { unique: true });

LeaveApprovalSchema.pre('findOneAndUpdate', async function(next) {
    const update = this.getUpdate();
    const isApprovedChanged = update.isApproved === true;
    const isDeniedChanged = update.isDenied === true;
    const extensionChanged = update.extension === true;
    const resumptionChanged = update.resumption === true;

    if (isApprovedChanged || isDeniedChanged || extensionChanged || resumptionChanged) {
        const docToUpdate = await this.model.findOne(this.getQuery());

        let notificationTitle;
        let notificationBody;

        if (isApprovedChanged) {
            notificationTitle = 'Leave Approved';
            notificationBody = 'Your leave has been approved.';
        } else if (isDeniedChanged) {
            notificationTitle = 'Leave Denied';
            notificationBody = 'Your leave has been denied.';
        } else if (extensionChanged) {
            notificationTitle = 'Leave Extended';
            notificationBody = 'Your leave has been extended.';
        } else if (resumptionChanged) {
            notificationTitle = 'Leave Resumed';
            notificationBody = 'Resume your duty.';
        }

        try {
            const user = await RegisteredUser.findOne({ beltNumber: docToUpdate.beltNumber });
            if (user && user.fcmToken) {
                console.log(`Sending notification to beltNumber: ${docToUpdate.beltNumber}, FCM Token: ${user.fcmToken}`);

                const message = {
                    notification: {
                        title: notificationTitle,
                        body: notificationBody
                    },
                    token: user.fcmToken
                };

                const response = await admin.messaging().send(message);
                console.log('Successfully sent message:', response);
            } else {
                console.error(`FCM token for user with belt number ${docToUpdate.beltNumber} not found`);
            }
        } catch (error) {
            console.error('Error sending notification:', error);
        }

        if (isApprovedChanged || isDeniedChanged) {
            // First, set isAssigned to false in ConfirmedPso
            try {
                const confirmedPsoUpdateResult = await ConfirmedPso.updateOne(
                    { beltNumber: docToUpdate.beltNumber },
                    { $set: { isAssigned: false } }
                );
                if (confirmedPsoUpdateResult.modifiedCount > 0) {
                    console.log(`ConfirmedPso with beltNumber: ${docToUpdate.beltNumber} is marked as not assigned`);
                } else {
                    console.log(`No ConfirmedPso found or modified with beltNumber: ${docToUpdate.beltNumber}`);
                }
            } catch (error) {
                console.error('Error updating ConfirmedPso:', error);
            }

            // Then, delete the specific assigned PSO if leave is approved
            if (isApprovedChanged) {
                try {
                    const livePPUpdateResult = await LivePPModel.updateOne(
                        { 'assignedPSOs.id': docToUpdate.beltNumber },
                        { $pull: { assignedPSOs: { id: docToUpdate.beltNumber } } }
                    );
                    if (livePPUpdateResult.modifiedCount > 0) {
                        console.log(`Assigned PSO with beltNumber: ${docToUpdate.beltNumber} deleted`);
                    } else {
                        console.log(`No assigned PSO found or modified with beltNumber: ${docToUpdate.beltNumber}`);
                    }
                } catch (error) {
                    console.error('Error deleting assigned PSO:', error);
                }
            }
        }
    } else {
        console.log('No changes detected in isApproved, isDenied, extension, or resumption fields to true.');
    }
    next();
});

LeaveApprovalSchema.post('findOneAndDelete', async function(doc) {
    if (doc) {
        try {
            console.log(`Attempting to update ConfirmedPso for beltNumber: ${doc.beltNumber}`);
            const confirmedPsoUpdateResult = await ConfirmedPso.updateOne(
                { beltNumber: doc.beltNumber },
                { $set: { isAssigned: false } }
            );
            if (confirmedPsoUpdateResult.modifiedCount > 0) {
                console.log(`ConfirmedPso with beltNumber: ${doc.beltNumber} is marked as not assigned`);
            } else {
                console.log(`No ConfirmedPso found or modified with beltNumber: ${doc.beltNumber}`);
            }
        } catch (error) {
            console.error('Error updating ConfirmedPso:', error);
        }
    }
});

// Schedule a job to run every hour to check leaves ending soon and send notifications
cron.schedule('0 * * * *', async () => {
    const now = new Date();
    const twelveHoursLater = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    try {
        const leavesEndingSoon = await mongoose.model('LeaveApproval').find({
            endDate: { $lte: twelveHoursLater, $gt: now },
            isApproved: true,
            reqresumption: false,
            reqextension: false
        });

        for (const leave of leavesEndingSoon) {
            const hoursLeft = Math.round((leave.endDate - now) / (1000 * 60 * 60));
            console.log(`Leave for belt number ${leave.beltNumber} ends in ${hoursLeft} hours.`);

            const user = await RegisteredUser.findOne({ beltNumber: leave.beltNumber });

            if (user && user.fcmToken) {
                const message = {
                    notification: {
                        title: 'Leave Ending Soon',
                        body: 'Your leave will end in less than 12 hours. Please resume or request an extension.'
                    },
                    token: user.fcmToken
                };

                const response = await admin.messaging().send(message);
                console.log(`Successfully sent notification to ${user.beltNumber}: ${response}`);
            } else {
                console.error(`FCM token for user with belt number ${leave.beltNumber} not found`);
            }
        }
    } catch (error) {
        console.error('Error sending notifications:', error);
    }
});

// Schedule a job to run every hour to reset leave fields when there are exactly 12 hours left
cron.schedule('0 * * * *', async () => {
    const now = new Date();
    const twelveHoursLater = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    try {
        const leavesToReset = await mongoose.model('LeaveApproval').find({
            endDate: { $lte: twelveHoursLater, $gt: now },
            isApproved: true,
            extension: true,
            resumption: true,
            reqresumption: true,
            reqextension: true
        });

        for (const leave of leavesToReset) {
            await mongoose.model('LeaveApproval').findOneAndUpdate(
                { _id: leave._id },
                {
                    extension: false,
                    resumption: false,
                    reqresumption: false,
                    reqextension: false
                }
            );
            console.log(`Reset leave fields for belt number ${leave.beltNumber}`);
        }
    } catch (error) {
        console.error('Error resetting leave fields:', error);
    }
});

module.exports = mongoose.model('LeaveApproval', LeaveApprovalSchema);
