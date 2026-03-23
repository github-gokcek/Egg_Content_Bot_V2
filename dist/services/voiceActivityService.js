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
    CHECK_INTERVAL = 2 * 60 * 1000; // 2 dakika
    activeSessions = new Map();
    start() {
        this.loadActiveSessions();
        this.checkInterval = setInterval(() => {
            this.checkSessions();
        }, this.CHECK_INTERVAL);
        logger_1.Logger.info('Voice activity tracking başlatıldı (memory cache ile)');
    }
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
    async loadActiveSessions() {
        try {
            const snapshot = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'voiceSessions'));
            const now = Date.now();
            const STALE_THRESHOLD = 24 * 60 * 60 * 1000;
            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();
                const joinedAt = data.joinedAt || now;
                if (now - joinedAt > STALE_THRESHOLD) {
                    await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceSessions', docSnap.id));
                    logger_1.Logger.warn('Stale session cleaned', { userId: data.userId });
                }
                else {
                    this.activeSessions.set(data.userId, {
                        joinedAt: data.joinedAt || now,
                        totalSeconds: data.totalSeconds || 0
                    });
                }
            }
            logger_1.Logger.info('Active voice sessions loaded', { count: this.activeSessions.size });
        }
        catch (error) {
            logger_1.Logger.error('loadActiveSessions error', error);
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
            this.activeSessions.set(userId, {
                joinedAt: now,
                totalSeconds: 0
            });
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
            this.activeSessions.delete(userId);
            await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceSessions', userId));
            logger_1.Logger.info('Voice session bitti', { userId });
        }
        catch (error) {
            logger_1.Logger.error('endSession error', error);
        }
    }
    async checkSessions() {
        try {
            const now = Date.now();
            // Memory'deki aktif sessionları kontrol et (Firebase'den okuma YOK!)
            for (const [userId, session] of this.activeSessions.entries()) {
                const elapsedSeconds = Math.floor((now - session.joinedAt) / 1000);
                if (elapsedSeconds >= 120) {
                    const newTotalSeconds = session.totalSeconds + elapsedSeconds;
                    // Memory'yi güncelle
                    this.activeSessions.set(userId, {
                        joinedAt: now,
                        totalSeconds: newTotalSeconds
                    });
                    // Firebase'e kaydet (sadece 1 write)
                    await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceSessions', userId), {
                        joinedAt: now,
                        totalSeconds: newTotalSeconds,
                    });
                    // Quest tracking
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
                    // FP ver
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
            // Memory'deki sessionları sıfırla
            for (const [userId, session] of this.activeSessions.entries()) {
                const totalMinutes = Math.floor(session.totalSeconds / 60);
                if (totalMinutes > 0) {
                    try {
                        await questService_1.questService.trackVoice(userId, totalMinutes);
                        logger_1.Logger.info('Final voice track before reset', { userId, totalMinutes });
                    }
                    catch (error) {
                        logger_1.Logger.error('Final voice tracking error', error);
                    }
                }
                // Memory'de sıfırla
                this.activeSessions.set(userId, {
                    joinedAt: Date.now(),
                    totalSeconds: 0
                });
                // Firebase'e kaydet
                await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceSessions', userId), {
                    totalSeconds: 0,
                    joinedAt: Date.now(),
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
            // Önce memory'den kontrol et
            const session = this.activeSessions.get(userId);
            if (session) {
                const currentSeconds = Math.floor((Date.now() - session.joinedAt) / 1000);
                return session.totalSeconds + currentSeconds;
            }
            // Memory'de yoksa Firebase'den oku
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
