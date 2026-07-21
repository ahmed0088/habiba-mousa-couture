// ================================
// Firebase project configuration
// Replace the values below with your own project's config.
// Firebase Console → Project settings → General → Your apps → SDK setup and configuration
// ================================

const firebaseConfig = {
  apiKey: "AIzaSyAVggc4qcmmISMmq4RLrMzs3Wp_T0En2RQ",
  authDomain: "habibamousa-fe27f.firebaseapp.com",
  projectId: "habibamousa-fe27f",
  storageBucket: "habibamousa-fe27f.firebasestorage.app",
  messagingSenderId: "207496484972",
  appId: "1:207496484972:web:c0a85c69cfd1b1b13f6049",
  measurementId: "G-0W7SZT2YWB"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
