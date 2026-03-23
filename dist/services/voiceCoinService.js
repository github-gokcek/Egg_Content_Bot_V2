"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceCoinService = void 0;
const firebase_1 = require("./firebase");
const firestore_1 = require("firebase/firestore");
const databaseService_1 = require("./databaseService");
const logger_1 = require("../utils/logger");
class VoiceCoinService {
    checkInterval = null;
    PACKET_DURATION = 5 * 60 * 1000; // 5 dakika
    activeSessions = new Map();
    start() {
        this.loadActiveSessions();
        this.checkInterval = setInterval(() => {
            this.checkSessions();
        }, 1 * 60 * 1000); // Her 1 dakikada kontrol et
        logger_1.Logger.info('Voice coin tracking başlatıldı (memory cache ile)');
    }
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
    async loadActiveSessions() {
        try {
            const snapshot = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'voiceCoinSessions'));
            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();
                this.activeSessions.set(data.userId, data);
            }
            logger_1.Logger.info('Active voice coin sessions loaded', { count: this.activeSessions.size });
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
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const existingSession = this.activeSessions.get(userId);
            let session;
            if (existingSession && existingSession.lastResetDate === today) {
                session = existingSession;
            }
            else {
                session = {
                    userId,
                    joinedAt: now,
                    lastPacketTime: now,
                    dailyPackets: 0,
                    lastResetDate: today,
                };
            }
            this.activeSessions.set(userId, session);
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceCoinSessions', userId), session);
            logger_1.Logger.info('Voice coin session başladı', { userId });
        }
        catch (error) {
            logger_1.Logger.error('startSession error', error);
        }
    }
    async endSession(userId) {
        try {
            this.activeSessions.delete(userId);
            await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceCoinSessions', userId));
            logger_1.Logger.info('Voice coin session bitti', { userId });
        }
        catch (error) {
            logger_1.Logger.error('endSession error', error);
        }
    }
    calculateCoinReward(packetCount) {
        if (packetCount === 1)
            return 40;
        if (packetCount === 2)
            return 20;
        if (packetCount === 3)
            return 10;
        if (packetCount === 4)
            return 5;
        return 1;
    }
    async checkSessions() {
        try {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            // Memory'deki aktif sessionları kontrol et (Firebase'den okuma YOK!)
            for (const [userId, session] of this.activeSessions.entries()) {
                // Gün değişmişse sıfırla
                if (session.lastResetDate !== today) {
                    session.dailyPackets = 0;
                    session.lastResetDate = today;
                    session.lastPacketTime = now;
                    this.activeSessions.set(userId, session);
                    await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceCoinSessions', userId), {
                        dailyPackets: 0,
                        lastResetDate: today,
                        lastPacketTime: now,
                    });
                    continue;
                }
                // 5 dakika paket kontrolü
                const timeSinceLastPacket = now.getTime() - new Date(session.lastPacketTime).getTime();
                if (timeSinceLastPacket >= this.PACKET_DURATION) {
                    const completedPackets = Math.floor(timeSinceLastPacket / this.PACKET_DURATION);
                    const newPacketCount = session.dailyPackets + completedPackets;
                    const player = await databaseService_1.databaseService.getPlayer(userId);
                    if (player) {
                        let totalCoin = 0;
                        for (let i = 1; i <= completedPackets; i++) {
                            totalCoin += this.calculateCoinReward(session.dailyPackets + i);
                        }
                        player.balance += totalCoin;
                        player.voicePackets = (player.voicePackets || 0) + completedPackets;
                        await databaseService_1.databaseService.updatePlayer(player);
                        // Memory'yi güncelle
                        session.lastPacketTime = now;
                        session.dailyPackets = newPacketCount;
                        this.activeSessions.set(userId, session);
                        // Firebase'e kaydet
                        await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceCoinSessions', userId), {
                            lastPacketTime: now,
                            dailyPackets: newPacketCount,
                        });
                        logger_1.Logger.success('Voice coin paketleri verildi', {
                            userId,
                            packets: completedPackets,
                            totalCoin,
                            totalPackets: newPacketCount,
                            newBalance: player.balance
                        });
                    }
                }
            }
        }
        catch (error) {
            logger_1.Logger.error('checkSessions error', error);
        }
    }
    async resetDailyCoins() {
        try {
            const today = new Date().toISOString().split('T')[0];
            // Memory'deki sessionları sıfırla
            for (const [userId, session] of this.activeSessions.entries()) {
                session.dailyPackets = 0;
                session.lastResetDate = today;
                this.activeSessions.set(userId, session);
                await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceCoinSessions', userId), {
                    dailyPackets: 0,
                    lastResetDate: today,
                });
            }
            logger_1.Logger.success('Voice günlük coin paketleri sıfırlandı');
        }
        catch (error) {
            logger_1.Logger.error('resetDailyCoins error', error);
        }
    }
}
exports.voiceCoinService = new VoiceCoinService();
