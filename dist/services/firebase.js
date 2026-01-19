"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const app_1 = require("firebase/app");
const firestore_1 = require("firebase/firestore");
const logger_1 = require("../utils/logger");
const firebaseConfig = {
    apiKey: "AIzaSyC4zqJc-Jb5uSNbAfUjr9hGaZPD_C_u2os",
    authDomain: "egg-content-bot-v2.firebaseapp.com",
    projectId: "egg-content-bot-v2",
    storageBucket: "egg-content-bot-v2.firebasestorage.app",
    messagingSenderId: "252254221237",
    appId: "1:252254221237:web:b477255ea5a292754b1ffc",
    measurementId: "G-X5JJYJ3294"
};
const app = (0, app_1.initializeApp)(firebaseConfig);
exports.db = (0, firestore_1.getFirestore)(app);
logger_1.Logger.success('Firebase initialized');
