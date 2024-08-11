import firebase from "firebase/compat/app";
import { getAuth } from "firebase/auth";
import {getStorage} from "firebase/storage"
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyAYfaaoi24oJl8dJLTqigiobeRhCpDJ8Oc",
  authDomain: "rsa-dashboard-34773.firebaseapp.com",
  projectId: "rsa-dashboard-34773",
  storageBucket: "rsa-dashboard-34773.appspot.com",
  messagingSenderId: "751667160757",
  appId: "1:751667160757:web:6eac73e5039f3249ff00fc"
};

const app = firebase.initializeApp(firebaseConfig);
const db = getFirestore(app);

const storage = getStorage(app)
const auth = getAuth(app);

export { auth ,storage };
export default app;