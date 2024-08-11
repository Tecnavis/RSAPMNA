import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import firebase from './config/config';
import Context  from './context/firebaseContext';

// Assuming you're using Firebase from the SDK
import { FirebaseApp } from 'firebase/app'; // Import the correct type

import 'react-perfect-scrollbar/dist/css/styles.css';
import './tailwind.css';
import './i18n';
import { RouterProvider } from 'react-router-dom';
import router from './router/index';
import { Provider } from 'react-redux';
import store from './store/index';

// Define the type here, using FirebaseApp or the appropriate Firebase type
interface FirebaseContextType {
    firebase: FirebaseApp;
}
const FirebaseContext = React.createContext<FirebaseContextType | null>(null);
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
