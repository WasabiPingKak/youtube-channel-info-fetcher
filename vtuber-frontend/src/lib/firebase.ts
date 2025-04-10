import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAOOxr08pARtQW1b9nOxulSZ7KgTgVD0ik",
    authDomain: "yt-channel-info-456010.firebaseapp.com",
    databaseURL: "https://yt-channel-info-456010-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "yt-channel-info-456010",
    storageBucket: "yt-channel-info-456010.firebasestorage.app",
    messagingSenderId: "260305364477",
    appId: "1:260305364477:web:d2c59f786ca5d28fe0e594",
    measurementId: "G-SBT6Z40SD8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
