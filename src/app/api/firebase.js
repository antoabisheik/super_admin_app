// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_URL,
  authDomain: "smart-auth-68b91.firebaseapp.com",
  projectId: "smart-auth-68b91",
  storageBucket: "smart-auth-68b91.firebasestorage.app",
  messagingSenderId: "256816365212",
  appId: "1:256816365212:web:4add8b947a168dc7253759",
  measurementId: "G-3VQ7E9LWG9"
};



const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { db, auth, googleProvider , firebaseConfig ,storage};