import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyBySlPXxcMNcNbyi17vX1OaYYPtvYByitg",
  authDomain: "sharee-74b0b.firebaseapp.com",
  projectId: "sharee-74b0b",
  storageBucket: "sharee-74b0b.firebasestorage.app",
  messagingSenderId: "833483915699",
  appId: "1:833483915699:web:6f46f93e62cae3412b0bc6",
  measurementId: "G-7L4QJXZF41"
};

const app = initializeApp(firebaseConfig);

export { app };