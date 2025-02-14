// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAvg80SUhF_bYfqxGrI9jeG3jupTFQSKH0",
  authDomain: "palliative-app-version-1.firebaseapp.com",
  projectId: "palliative-app-version-1",
  storageBucket: "palliative-app-version-1.firebasestorage.app",
  messagingSenderId: "606406902443",
  appId: "1:606406902443:web:02076908304fd0f65e2dee",
  measurementId: "G-BKED092BZT"
};

const FirebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(FirebaseApp);
