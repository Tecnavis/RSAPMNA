// NotificationService.ts
import { messaging } from "./firebase";
import { getToken, onMessage, Messaging } from "firebase/messaging";

class NotificationService {
  static async requestPermission(): Promise<boolean> {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        return true;
      } else {
        console.log('Notification permission denied.');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    }
  }

  static async getToken(): Promise<string | null> {
    try {
      const currentToken = await getToken(messaging, { vapidKey: 'BKPoKIWRkx6sdBatbMyNn_rw0aT7kw52-FNKZIlfYV6QD2knwxCSEUBU_CDMJSjJnYflUix08tmsJ2-ddbnrzoQ' });
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        return currentToken;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } catch (error) {
      console.error('An error occurred while retrieving token.', error);
      throw error;
    }
  }

  static onMessageListener(callback: (payload: any) => void): void {
    onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      callback(payload);
    });
  }
}

export default NotificationService;
