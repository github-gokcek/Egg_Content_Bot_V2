"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceActivityService = void 0;
const firebase_1 = require("./firebase");
const firestore_1 = require("firebase/firestore");
const factionService_1 = require("./factionService");
const faction_1 = require("../types/faction");
const logger_1 = require("../utils/logger");
class VoiceActivityService {
    checkInterval = null;
    start() {
        this.checkInterval = setInterval(() => {
            this.checkSessions();
        }, 10 * 60 * 1000);
        logger_1.Logger.info('Voice activity tracking başlatıldı');
    }
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
    async handleVoiceStateUpdate(oldState, newState) {
        const userId = newState.id;
        if (!oldState.channelId && newState.channelId) {
            await this.startSession(userId);
        }
        else if (oldState.channelId && !newState.channelId) {
            await this.endSession(userId);
        }
    }
    async startSession(userId) {
        try {
            const now = new Date();
            const session = {
                userId,
                joinedAt: now,
                lastFPAward: now,
                dailyFPEarned: 0,
            };
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceSessions', userId), session);
            logger_1.Logger.info('Voice session başladı', { userId });
        }
        catch (error) {
            logger_1.Logger.error('startSession error', error);
        }
    }
    async endSession(userId) {
        try {
            await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceSessions', userId));
            logger_1.Logger.info('Voice session bitti', { userId });
        }
        catch (error) {
            logger_1.Logger.error('endSession error', error);
        }
    }
    async checkSessions() {
        try {
            const snapshot = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'voiceSessions'));
            const now = new Date();
            for (const docSnap of snapshot.docs) {
                const session = docSnap.data();
                const userId = session.userId;
                const timeSinceLastAward = now.getTime() - new Date(session.lastFPAward).getTime();
                const minutesSinceLastAward = timeSinceLastAward / (1000 * 60);
                if (minutesSinceLastAward >= 10) {
                    if (session.dailyFPEarned >= faction_1.FP_RATES.VOICE_DAILY_CAP) {
                        logger_1.Logger.info('Voice FP günlük limite ulaşıldı', { userId, dailyFP: session.dailyFPEarned });
                        continue;
                    }
                    const success = await factionService_1.factionService.awardFP(userId, faction_1.FP_RATES.VOICE_ACTIVITY_PER_10MIN, 'voice_activity', { duration: '10min' });
                    if (success) {
                        await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceSessions', userId), {
                            lastFPAward: now,
                            dailyFPEarned: session.dailyFPEarned + faction_1.FP_RATES.VOICE_ACTIVITY_PER_10MIN,
                        });
                        logger_1.Logger.success('Voice FP verildi', {
                            userId,
                            amount: faction_1.FP_RATES.VOICE_ACTIVITY_PER_10MIN,
                            dailyTotal: session.dailyFPEarned + faction_1.FP_RATES.VOICE_ACTIVITY_PER_10MIN
                        });
                    }
                }
            }
        }
        catch (error) {
            logger_1.Logger.error('checkSessions error', error);
        }
    }
    async resetDailyFP() {
        try {
            const snapshot = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'voiceSessions'));
            for (const docSnap of snapshot.docs) {
                await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceSessions', docSnap.id), {
                    dailyFPEarned: 0,
                });
            }
            logger_1.Logger.success('Voice günlük FP sıfırlandı');
        }
        catch (error) {
            logger_1.Logger.error('resetDailyFP error', error);
        }
    }
}
exports.voiceActivityService = new VoiceActivityService();
