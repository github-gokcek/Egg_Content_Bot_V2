"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceActivityService = void 0;
const firebase_1 = require("./firebase");
const firestore_1 = require("firebase/firestore");
const factionService_1 = require("./factionService");
const faction_1 = require("../types/faction");
const logger_1 = require("../utils/logger");
const questService_1 = require("./questService");
class VoiceActivityService {
    checkInterval = null;
    CHECK_INTERVAL = 2 * 60 * 1000; // 2 dakika (Firebase quota için)
    start() {
        this.checkInterval = setInterval(() => {
            this.checkSessions();
        }, this.CHECK_INTERVAL);
        logger_1.Logger.info('Voice activity tracking başlatıldı (saniye bazlı)');
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
            const now = Date.now();
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceSessions', userId), {
                userId: userId,
                joinedAt: now,
                totalSeconds: 0,
            });
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
            const now = Date.now();
            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();
                const userId = data.userId;
                const joinedAt = data.joinedAt || now;
                const totalSeconds = data.totalSeconds || 0;
                // Geçen süreyi hesapla (saniye)
                const elapsedSeconds = Math.floor((now - joinedAt) / 1000);
                if (elapsedSeconds >= 120) { // En az 2 dakika (Firebase quota için)
                    // Toplam süreyi güncelle
                    const newTotalSeconds = totalSeconds + elapsedSeconds;
                    await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceSessions', userId), {
                        joinedAt: now, // Yeni başlangıç noktası
                        totalSeconds: newTotalSeconds,
                    });
                    // Quest tracking - HER ZAMAN gönder (saniye olarak)
                    // questService içinde dakikaya çevrilecek
                    try {
                        const totalMinutes = Math.floor(newTotalSeconds / 60);
                        await questService_1.questService.trackVoice(userId, totalMinutes);
                        logger_1.Logger.success('Voice tracked', {
                            userId,
                            elapsedSeconds,
                            totalSeconds: newTotalSeconds,
                            totalMinutes
                        });
                    }
                    catch (error) {
                        logger_1.Logger.error('Quest voice tracking error', error);
                    }
                    // FP ver (her 10 dakika)
                    const fpMinutes = Math.floor(newTotalSeconds / 60);
                    const fpToGive = Math.floor(fpMinutes / 10) * faction_1.FP_RATES.VOICE_ACTIVITY_PER_10MIN;
                    if (fpToGive > 0) {
                        await factionService_1.factionService.awardFP(userId, fpToGive, 'voice_activity', { totalMinutes: Math.floor(newTotalSeconds / 60) });
                    }
                }
            }
        }
        catch (error) {
            logger_1.Logger.error('checkSessions error', error);
        }
    }
    async resetDailyVoice() {
        try {
            const snapshot = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'voiceSessions'));
            for (const docSnap of snapshot.docs) {
                await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceSessions', docSnap.id), {
                    totalSeconds: 0,
                });
            }
            logger_1.Logger.success('Voice günlük süreler sıfırlandı');
        }
        catch (error) {
            logger_1.Logger.error('resetDailyVoice error', error);
        }
    }
    async getUserVoiceTime(userId) {
        try {
            const docSnap = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceSessions', userId));
            if (!docSnap.exists())
                return 0;
            const data = docSnap.data();
            const totalSeconds = data.totalSeconds || 0;
            const joinedAt = data.joinedAt || Date.now();
            const currentSeconds = Math.floor((Date.now() - joinedAt) / 1000);
            return totalSeconds + currentSeconds;
        }
        catch (error) {
            logger_1.Logger.error('getUserVoiceTime error', error);
            return 0;
        }
    }
}
exports.voiceActivityService = new VoiceActivityService();
