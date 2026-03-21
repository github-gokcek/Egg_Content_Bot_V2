"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdChannel = getAdChannel;
exports.setAdChannel = setAdChannel;
exports.getAdTimer = getAdTimer;
exports.setAdTimer = setAdTimer;
const firebase_1 = require("./firebase");
const firestore_1 = require("firebase/firestore");
const SETTINGS_DOC = 'botSettings/config';
async function getAdChannel() {
    const docRef = (0, firestore_1.doc)(firebase_1.db, SETTINGS_DOC);
    const docSnap = await (0, firestore_1.getDoc)(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return data.adChannelId || null;
    }
    return null;
}
async function setAdChannel(channelId) {
    const docRef = (0, firestore_1.doc)(firebase_1.db, SETTINGS_DOC);
    await (0, firestore_1.setDoc)(docRef, { adChannelId: channelId }, { merge: true });
}
async function getAdTimer() {
    const docRef = (0, firestore_1.doc)(firebase_1.db, SETTINGS_DOC);
    const docSnap = await (0, firestore_1.getDoc)(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        return data.adTimerMinutes || 30;
    }
    return 30;
}
async function setAdTimer(minutes) {
    const docRef = (0, firestore_1.doc)(firebase_1.db, SETTINGS_DOC);
    await (0, firestore_1.setDoc)(docRef, { adTimerMinutes: minutes }, { merge: true });
}
