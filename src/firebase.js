// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore,  collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit,  doc, deleteDoc} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxPj_xXUe6rcOygi7AY-SUUPaFQ4WMEyM",
  authDomain: "chat9-utitbest.firebaseapp.com",
  projectId: "chat9-utitbest",
  storageBucket: "chat9-utitbest.firebasestorage.app",
  messagingSenderId: "74092563754",
  appId: "1:74092563754:web:59a17712b98dc8939d6253",
  measurementId: "G-B8BX3NSP7M"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export { auth, provider, signInWithPopup, doc, deleteDoc, limit, signOut, db, query, orderBy, collection, addDoc, getDocs, serverTimestamp, onAuthStateChanged };
