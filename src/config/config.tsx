// import firebase from "firebase/compat/app";
// import { getAuth } from "firebase/auth";
// import {getStorage} from "firebase/storage"
// import { getFirestore } from "firebase/firestore";
// const firebaseConfig = {
//   apiKey: "AIzaSyAYfaaoi24oJl8dJLTqigiobeRhCpDJ8Oc",
//   authDomain: "rsa-dashboard-34773.firebaseapp.com",
//   projectId: "rsa-dashboard-34773",
//   storageBucket: "rsa-dashboard-34773.appspot.com",
//   messagingSenderId: "751667160757",
//   appId: "1:751667160757:web:6eac73e5039f3249ff00fc"
// };

// const app = firebase.initializeApp(firebaseConfig);
// const db = getFirestore(app);

// const storage = getStorage(app)
// const auth = getAuth(app);

// export { auth ,storage };
// export default app;


// Import the functions you need from the SDKs you need
import firebase from "firebase/compat/app";
import { getAuth } from "firebase/auth";
import {getStorage} from "firebase/storage"
import { getFirestore } from "firebase/firestore";
import {getMessaging, getToken} from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCih6LyMfSvEJ7qDluDHSInumgdLPKtxe8",
  authDomain: "rsapmna-de966.firebaseapp.com",
  projectId: "rsapmna-de966",
  storageBucket: "rsapmna-de966.appspot.com",
  messagingSenderId: "47505700508",
  appId: "1:47505700508:web:efaaedd713713d30b49f59",
  measurementId: "G-S260TFML8X"
};

const app = firebase.initializeApp(firebaseConfig);

const db = getFirestore(app);

// Initialize services
const auth = getAuth(app);
const storage = getStorage(app);
const messaging = getMessaging(app);
getToken(messaging, {vapidKey:"BKPoKIWRkx6sdBatbMyNn_rw0aT7kw52-FNKZIlfYV6QD2knwxCSEUBU_CDMJSjJnYflUix08tmsJ2-ddbnrzoQ"})

export { auth ,storage , messaging};
export default app;
export const generateToken = async () => {
  try {
    // Request user permission for notifications
    const permission = await Notification.requestPermission();
    console.log(`Notification permission: ${permission}`);
    
    if (permission === "granted") {
      // Generate FCM Token using the VAPID key
      const token = await getToken(messaging, {
        vapidKey: "BKPoKIWRkx6sdBatbMyNn_rw0aT7kw52-FNKZIlfYV6QD2knwxCSEUBU_CDMJSjJnYflUix08tmsJ2-ddbnrzoQ"
      });

      if (token) {
        console.log('FCM Token:', token);
        // You can send the token to your server here
      } else {
        console.log('Failed to get FCM token.');
      }
    }
  } catch (error) {
    console.error('Error generating FCM token:', error);
  }
};
