"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMajorWarning = removeMajorWarning;
exports.removeChatWarning = removeChatWarning;
exports.addMajorWarning = addMajorWarning;
exports.addChatWarning = addChatWarning;
exports.getWarnings = getWarnings;
const firebase_1 = require("./firebase");
const firestore_1 = require("firebase/firestore");
async function removeMajorWarning(guildId, userId) {
    const warningRef = (0, firestore_1.doc)(firebase_1.db, 'warnings', `${guildId}_${userId}`);
    const warningDoc = await (0, firestore_1.getDoc)(warningRef);
    if (warningDoc.exists() && warningDoc.data().majorWarnings > 0) {
        await (0, firestore_1.updateDoc)(warningRef, {
            majorWarnings: (0, firestore_1.increment)(-1),
            lastWarningAt: new Date()
        });
        return (warningDoc.data().majorWarnings || 0) - 1;
    }
    return 0;
}
async function removeChatWarning(guildId, userId) {
    const warningRef = (0, firestore_1.doc)(firebase_1.db, 'warnings', `${guildId}_${userId}`);
    const warningDoc = await (0, firestore_1.getDoc)(warningRef);
    if (warningDoc.exists() && warningDoc.data().chatWarnings > 0) {
        await (0, firestore_1.updateDoc)(warningRef, {
            chatWarnings: (0, firestore_1.increment)(-1),
            lastWarningAt: new Date()
        });
        return (warningDoc.data().chatWarnings || 0) - 1;
    }
    return 0;
}
async function addMajorWarning(guildId, userId) {
    const warningRef = (0, firestore_1.doc)(firebase_1.db, 'warnings', `${guildId}_${userId}`);
    const warningDoc = await (0, firestore_1.getDoc)(warningRef);
    if (warningDoc.exists()) {
        await (0, firestore_1.updateDoc)(warningRef, {
            majorWarnings: (0, firestore_1.increment)(1),
            lastWarningAt: new Date()
        });
        return (warningDoc.data().majorWarnings || 0) + 1;
    }
    else {
        await (0, firestore_1.setDoc)(warningRef, {
            userId,
            guildId,
            majorWarnings: 1,
            chatWarnings: 0,
            lastWarningAt: new Date()
        });
        return 1;
    }
}
async function addChatWarning(guildId, userId) {
    const warningRef = (0, firestore_1.doc)(firebase_1.db, 'warnings', `${guildId}_${userId}`);
    const warningDoc = await (0, firestore_1.getDoc)(warningRef);
    if (warningDoc.exists()) {
        await (0, firestore_1.updateDoc)(warningRef, {
            chatWarnings: (0, firestore_1.increment)(1),
            lastWarningAt: new Date()
        });
        return (warningDoc.data().chatWarnings || 0) + 1;
    }
    else {
        await (0, firestore_1.setDoc)(warningRef, {
            userId,
            guildId,
            majorWarnings: 0,
            chatWarnings: 1,
            lastWarningAt: new Date()
        });
        return 1;
    }
}
async function getWarnings(guildId, userId) {
    const warningRef = (0, firestore_1.doc)(firebase_1.db, 'warnings', `${guildId}_${userId}`);
    const warningDoc = await (0, firestore_1.getDoc)(warningRef);
    if (warningDoc.exists()) {
        return warningDoc.data();
    }
    return null;
}
