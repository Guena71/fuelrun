import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

var firebaseConfig = {
  apiKey:            "AIzaSyCuk3aJprZXGAzSFkZ7evNrVFOqcfUwZT8",
  authDomain:        "fuelrun-7a369.firebaseapp.com",
  projectId:         "fuelrun-7a369",
  storageBucket:     "fuelrun-7a369.firebasestorage.app",
  messagingSenderId: "383250949614",
  appId:             "1:383250949614:web:67c4ed54830ef16aa75aff",
  measurementId:     "G-BMD3GB4XTG",
};

var app = initializeApp(firebaseConfig);
export var auth = getAuth(app);
export var db = getFirestore(app);
export var googleProvider = new GoogleAuthProvider();
export var appleProvider = new OAuthProvider('apple.com');
export { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, doc, setDoc, getDoc };
