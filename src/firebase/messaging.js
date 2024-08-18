// src/firebase/messaging.js
import firebase from '../config/config';

const messaging = firebase.messaging();

export const requestPermission = () => messaging.requestPermission();
export const onMessage = (callback) => messaging.onMessage(callback);
export const onTokenRefresh = (callback) => messaging.onTokenRefresh(callback);