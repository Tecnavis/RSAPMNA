import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import firebase from './config/config';
import Context from './context/firebaseContext';

// Import the correct Firebase type
import { FirebaseApp } from 'firebase/app';

import 'react-perfect-scrollbar/dist/css/styles.css';
import './tailwind.css';
import './i18n';
import { RouterProvider } from 'react-router-dom';
import router from './router/index';
import { Provider } from 'react-redux';
import store from './store/index';

// Define the Firebase context type
interface FirebaseContextType {
    firebase: FirebaseApp;
}
const FirebaseContext = React.createContext<FirebaseContextType | null>(null);

// Register the service worker for Firebase Cloud Messaging
if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
            console.log('Service Worker registration failed:', error);
        });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <Suspense>
            <Provider store={store}>
                <Context>
                    <FirebaseContext.Provider value={{ firebase } as FirebaseContextType}>
                        <RouterProvider router={router} />
                    </FirebaseContext.Provider>
                </Context>
            </Provider>
        </Suspense>
    </React.StrictMode>
);
