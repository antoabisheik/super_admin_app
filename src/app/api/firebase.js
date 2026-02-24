// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "smartan-fitness.firebaseapp.com",
  projectId: "smartan-fitness",
  storageBucket: "smartan-fitness.firebasestorage.app",
  messagingSenderId: "256816365212",
  appId: "1:673689510832:web:aa40ba8dab56761fd0ec75",
  measurementId: "G-8JD012XVXR"
};



const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

export { db, auth, googleProvider , firebaseConfig ,storage};