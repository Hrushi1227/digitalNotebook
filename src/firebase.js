import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAuh7Tqc6H-Tl7nxnZXgdMFi9H5faFjtxE",
  authDomain: "digitalcalculator-d7027.firebaseapp.com",
  projectId: "digitalcalculator-d7027",
  storageBucket: "digitalcalculator-d7027.appspot.com",
  messagingSenderId: "1032635974968",
  appId: "1:1032635974968:web:fb459bcc360d9bbb7aedcd",
  measurementId: "G-13GWP7C7C7",
};

const app = initializeApp(firebaseConfig);

// Firestore database
export const db = getFirestore(app);

// Cloud Storage
export const storage = getStorage(app);
