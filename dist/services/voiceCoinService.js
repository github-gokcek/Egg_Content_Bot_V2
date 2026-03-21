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
    start() {
        this.checkInterval = setInterval(() => {
            this.checkSessions();
        }, 1 * 60 * 1000); // Her 1 dakikada kontrol et (5 dakika paketleri için)
        logger_1.Logger.info('Voice coin tracking başlatıldı (5 dakika paket sistemi)');
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
            const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
            const existingSession = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceCoinSessions', userId));
            if (existingSession.exists()) {
                const session = existingSession.data();
                // Eğer aynı gün ise devam et, değilse sıfırla
                if (session.lastResetDate !== today) {
                    await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceCoinSessions', userId), {
                        userId,
                        joinedAt: now,
                        lastPacketTime: now,
                        dailyPackets: 0,
                        lastResetDate: today,
                    });
                }
            }
            else {
                const session = {
                    userId,
                    joinedAt: now,
                    lastPacketTime: now,
                    dailyPackets: 0,
                    lastResetDate: today,
                };
                await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceCoinSessions', userId), session);
            }
            logger_1.Logger.info('Voice coin session başladı', { userId });
        }
        catch (error) {
            logger_1.Logger.error('startSession error', error);
        }
    }
    async endSession(userId) {
        try {
            await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceCoinSessions', userId));
            logger_1.Logger.info('Voice coin session bitti', { userId });
        }
        catch (error) {
            logger_1.Logger.error('endSession error', error);
        }
    }
    calculateCoinReward(packetCount) {
        // 1. paket: 40 coin
        // 2. paket: 20 coin
        // 3. paket: 10 coin
        // 4. paket: 5 coin
        // 5+ paket: 1 coin
        if (packetCount === 1)
            return 40;
        if (packetCount === 2)
            return 20;
        if (packetCount === 3)
            return 10;
        if (packetCount === 4)
            return 5;
        return 1; // 5+ pakette hep 1 coin
    }
    async checkSessions() {
        try {
            const snapshot = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'voiceCoinSessions'));
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            for (const docSnap of snapshot.docs) {
                const session = docSnap.data();
                const userId = session.userId;
                // Gün değişmişse sıfırla
                if (session.lastResetDate !== today) {
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
                    // Kaç paket tamamlandığını hesapla
                    const completedPackets = Math.floor(timeSinceLastPacket / this.PACKET_DURATION);
                    const newPacketCount = session.dailyPackets + completedPackets;
                    // Oyuncuya coin ver
                    const player = await databaseService_1.databaseService.getPlayer(userId);
                    if (player) {
                        // Her paket için coin hesapla
                        let totalCoin = 0;
                        for (let i = 1; i <= completedPackets; i++) {
                            totalCoin += this.calculateCoinReward(session.dailyPackets + i);
                        }
                        player.balance += totalCoin;
                        player.voicePackets = (player.voicePackets || 0) + completedPackets;
                        await databaseService_1.databaseService.updatePlayer(player);
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
            const snapshot = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'voiceCoinSessions'));
            const today = new Date().toISOString().split('T')[0];
            for (const docSnap of snapshot.docs) {
                await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'voiceCoinSessions', docSnap.id), {
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
