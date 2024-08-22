import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";



const firebaseConfig = {
    apiKey: "AIzaSyCih6LyMfSvEJ7qDluDHSInumgdLPKtxe8",
    authDomain: "rsapmna-de966.firebaseapp.com",
    projectId: "rsapmna-de966",
    storageBucket: "rsapmna-de966.appspot.com",
    messagingSenderId: "47505700508",
    appId: "1:47505700508:web:efaaedd713713d30b49f59",
    measurementId: "G-S260TFML8X"
  };

  // Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging };