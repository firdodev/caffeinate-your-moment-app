import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDFOy8m9o68jIx0Y5vzig9xbABi22ii4I0',
  authDomain: 'seton-80f66.firebaseapp.com',
  databaseURL: 'https://seton-80f66-default-rtdb.firebaseio.com',
  projectId: 'seton-80f66',
  storageBucket: 'seton-80f66.firebasestorage.app',
  messagingSenderId: '766734967278',
  appId: '1:766734967278:web:993104fddf173775de2eff',
  measurementId: 'G-HLSM61YR08'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

// Export initialized instances
export { auth, db, storage };
