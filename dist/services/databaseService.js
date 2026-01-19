"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseService = exports.DatabaseService = void 0;
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("./firebase");
const logger_1 = require("../utils/logger");
class DatabaseService {
    // LoL Matches
    async saveLolMatch(match) {
        try {
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'lol_matches', match.id), {
                ...match,
                createdAt: match.createdAt.toISOString(),
                completedAt: match.completedAt?.toISOString()
            });
            logger_1.Logger.success('LoL maç Firebase\'e kaydedildi', { matchId: match.id });
        }
        catch (error) {
            logger_1.Logger.error('LoL maç kaydedilemedi', error);
        }
    }
    async getLolMatch(id) {
        try {
            const docSnap = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'lol_matches', id));
            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    ...data,
                    createdAt: new Date(data.createdAt),
                    completedAt: data.completedAt ? new Date(data.completedAt) : undefined
                };
            }
            return null;
        }
        catch (error) {
            logger_1.Logger.error('LoL maç getirilemedi', error);
            return null;
        }
    }
    async updateLolMatch(match) {
        try {
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'lol_matches', match.id), {
                ...match,
                createdAt: match.createdAt.toISOString(),
                completedAt: match.completedAt?.toISOString()
            });
            logger_1.Logger.success('LoL maç güncellendi', { matchId: match.id });
        }
        catch (error) {
            logger_1.Logger.error('LoL maç güncellenemedi', error);
        }
    }
    async deleteLolMatch(id) {
        try {
            await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'lol_matches', id));
            logger_1.Logger.success('LoL maç silindi', { matchId: id });
        }
        catch (error) {
            logger_1.Logger.error('LoL maç silinemedi', error);
        }
    }
    // TFT Matches
    async saveTftMatch(match) {
        try {
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'tft_matches', match.id), {
                ...match,
                createdAt: match.createdAt.toISOString(),
                completedAt: match.completedAt?.toISOString()
            });
            logger_1.Logger.success('TFT maç Firebase\'e kaydedildi', { matchId: match.id });
        }
        catch (error) {
            logger_1.Logger.error('TFT maç kaydedilemedi', error);
        }
    }
    async getTftMatch(id) {
        try {
            const docSnap = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'tft_matches', id));
            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    ...data,
                    createdAt: new Date(data.createdAt),
                    completedAt: data.completedAt ? new Date(data.completedAt) : undefined
                };
            }
            return null;
        }
        catch (error) {
            logger_1.Logger.error('TFT maç getirilemedi', error);
            return null;
        }
    }
    async updateTftMatch(match) {
        try {
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'tft_matches', match.id), {
                ...match,
                createdAt: match.createdAt.toISOString(),
                completedAt: match.completedAt?.toISOString()
            });
            logger_1.Logger.success('TFT maç güncellendi', { matchId: match.id });
        }
        catch (error) {
            logger_1.Logger.error('TFT maç güncellenemedi', error);
        }
    }
    async deleteTftMatch(id) {
        try {
            await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'tft_matches', id));
            logger_1.Logger.success('TFT maç silindi', { matchId: id });
        }
        catch (error) {
            logger_1.Logger.error('TFT maç silinemedi', error);
        }
    }
    // Players
    async savePlayer(player) {
        try {
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'players', player.discordId), {
                ...player,
                createdAt: player.createdAt.toISOString()
            });
            logger_1.Logger.success('Oyuncu Firebase\'e kaydedildi', { playerId: player.discordId });
        }
        catch (error) {
            logger_1.Logger.error('Oyuncu kaydedilemedi', error);
        }
    }
    async getPlayer(discordId) {
        try {
            const docSnap = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'players', discordId));
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Bakiye yoksa veya NaN ise 100 olarak ayarla
                if (data.balance === undefined || data.balance === null || isNaN(data.balance)) {
                    data.balance = 100;
                }
                // createdAt yoksa şimdi olarak ayarla
                if (!data.createdAt) {
                    data.createdAt = new Date().toISOString();
                }
                return {
                    ...data,
                    createdAt: new Date(data.createdAt)
                };
            }
            return null;
        }
        catch (error) {
            logger_1.Logger.error('Oyuncu getirilemedi', error);
            return null;
        }
    }
    async updatePlayer(player) {
        try {
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'players', player.discordId), {
                ...player,
                createdAt: player.createdAt.toISOString()
            });
            logger_1.Logger.success('Oyuncu güncellendi', { playerId: player.discordId });
        }
        catch (error) {
            logger_1.Logger.error('Oyuncu güncellenemedi', error);
        }
    }
    // Config
    async saveConfig(guildId, config) {
        try {
            await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'guild_configs', guildId), config);
            logger_1.Logger.success('Sunucu ayarları kaydedildi', { guildId });
        }
        catch (error) {
            logger_1.Logger.error('Sunucu ayarları kaydedilemedi', error);
        }
    }
    async getConfig(guildId) {
        try {
            const docSnap = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'guild_configs', guildId));
            return docSnap.exists() ? docSnap.data() : null;
        }
        catch (error) {
            logger_1.Logger.error('Sunucu ayarları getirilemedi', error);
            return null;
        }
    }
}
exports.DatabaseService = DatabaseService;
exports.databaseService = new DatabaseService();
