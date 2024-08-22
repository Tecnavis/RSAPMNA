import { getMessaging, getToken } from "firebase/messaging";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const db = getFirestore();
const auth = getAuth();
const messaging = getMessaging();

export const generateToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "BKPoKIWRkx6sdBatbMyNn_rw0aT7kw52-FNKZIlfYV6QD2knwxCSEUBU_CDMJSjJnYflUix08tmsJ2-ddbnrzoQ"
      });
      return token;
    }
  } catch (error) {
    console.error('Error generating FCM token:', error);
  }
};

export const saveTokenToDatabase = async (token) => {
  try {
    const user = auth.currentUser;
    if (user) {
      const uid = user.uid;
      await updateDoc(doc(db, `user/${uid}/booking`, 'id'), { fcmToken: token });
      console.log('Token saved to database');
    } else {
      console.error('No authenticated user found.');
    }
  } catch (error) {
    console.error('Error saving token to database:', error);
  }
};

export const sendPushNotification = async (token, bookingData) => {
  try {
    const messagePayload = {
      notification: {
        title: 'Booking Update',
        body: `Booking for ${bookingData.customerName} has been ${bookingData.status}`,
      },
      token: token,
    };
    // Replace this with your function to send notification
    // await yourSendNotificationFunction(messagePayload);
    console.log('Push notification sent:', messagePayload);
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};
