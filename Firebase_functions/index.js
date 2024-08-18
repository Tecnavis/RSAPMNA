// firebase-functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const sendNotification = functions.firestore
  .document('user/{uid}/bookings/{bookingId}')
  .onWrite(async (change, context) => {
    const bookingData = change.after.data();

    const notificationPayload = {
      notification: {
        title: 'New Booking!',
        body: `Booking ID: ${bookingData.bookingId}`,
      },
      // Add targeting information (e.g., topic, device tokens)
    };

    const response = await admin.messaging().send(notificationPayload);
    console.log('Notification sent successfully:', response);
  });

module.exports = {sendNotification};
