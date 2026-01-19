import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { Logger } from '../utils/logger';

const firebaseConfig = {
  apiKey: "AIzaSyC4zqJc-Jb5uSNbAfUjr9hGaZPD_C_u2os",
  authDomain: "egg-content-bot-v2.firebaseapp.com",
  projectId: "egg-content-bot-v2",
  storageBucket: "egg-content-bot-v2.firebasestorage.app",
  messagingSenderId: "252254221237",
  appId: "1:252254221237:web:b477255ea5a292754b1ffc",
  measurementId: "G-X5JJYJ3294"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

Logger.success('Firebase initialized');