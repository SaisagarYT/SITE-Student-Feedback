
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD7NLOA5ZTKoJPCUid7I0S1ta21tiLuZIg",
  authDomain: "hackthon-65658.firebaseapp.com",
  projectId: "hackthon-65658",
  storageBucket: "hackthon-65658.firebasestorage.app",
  messagingSenderId: "809333688319",
  appId: "1:809333688319:web:69cdc072c618ba46c389ca",
  measurementId: "G-G9VCPQLDF8"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

