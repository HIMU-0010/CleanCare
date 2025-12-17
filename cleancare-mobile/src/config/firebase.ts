import { initializeApp } from 'firebase/app';
// @ts-ignore: getReactNativePersistence is available in RN build
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

export const firebaseConfig = {
  apiKey: "AIzaSyD-i7OhymuHjAHOljWNIA7VjaKHD5UH0BA",
  authDomain: "cleancare-1a331.firebaseapp.com",
  projectId: "cleancare-1a331",
  storageBucket: "cleancare-1a331.firebasestorage.app",
  messagingSenderId: "145631199338",
  appId: "1:145631199338:web:171e3ab613003ff53dca13",
  measurementId: "G-5C3D5XGYRE"
};

export const firebaseApp = initializeApp(firebaseConfig);

// Initialize Auth with persistence
initializeAuth(firebaseApp, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
