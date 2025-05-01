import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

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

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const firestore = getFirestore(app);
