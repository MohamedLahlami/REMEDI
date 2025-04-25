import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDYBF1RkZjm23ht-aDAD1EKwuiWdCqG93E",
  authDomain: "remedi-61fe2.firebaseapp.com",
  projectId: "remedi-61fe2",
  storageBucket: "remedi-61fe2.firebasestorage.app",
  messagingSenderId: "523802647762",
  appId: "1:523802647762:web:79c1ff863f40edc7d1610b",
  measurementId: "G-CK07Y7PJBQ",
};

// Initialize Firebase for modular API
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase for compat API
firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const firestore = firebase.firestore();
