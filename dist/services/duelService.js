"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.duelService = exports.DuelService = void 0;
const firebase_1 = require("./firebase");
const firestore_1 = require("firebase/firestore");
const logger_1 = require("../utils/logger");
class DuelService {
    async createDuel(challenger, challenged, amount) {
        const duel = {
            id: Date.now().toString(),
            challenger,
            challenged,
            amount,
            status: 'pending',
            createdAt: new Date()
        };
        await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'duels', duel.id), duel);
        logger_1.Logger.success('Düello oluşturuldu', { duelId: duel.id, challenger, challenged, amount });
        return duel;
    }
    async getDuel(id) {
        const docSnap = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'duels', id));
        return docSnap.exists() ? docSnap.data() : null;
    }
    async acceptDuel(id) {
        const duel = await this.getDuel(id);
        if (duel && duel.status === 'pending') {
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'duels', id), { status: 'accepted' });
            logger_1.Logger.info('Düello kabul edildi', { duelId: id });
            return true;
        }
        return false;
    }
    async completeDuel(id, winner) {
        const duel = await this.getDuel(id);
        if (duel && duel.status === 'accepted') {
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'duels', id), { status: 'completed', winner });
            logger_1.Logger.success('Düello tamamlandı', { duelId: id, winner });
            return true;
        }
        return false;
    }
    async cancelDuel(id) {
        const duel = await this.getDuel(id);
        if (duel && duel.status === 'pending') {
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'duels', id), { status: 'cancelled' });
            logger_1.Logger.info('Düello iptal edildi', { duelId: id });
            return true;
        }
        return false;
    }
    async deleteDuel(id) {
        try {
            await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'duels', id));
            logger_1.Logger.info('Düello silindi', { duelId: id });
            return true;
        }
        catch {
            return false;
        }
    }
    async getUserActiveDuels(userId) {
        const q = (0, firestore_1.query)((0, firestore_1.collection)(firebase_1.db, 'duels'), (0, firestore_1.where)('status', 'in', ['pending', 'accepted']));
        const snapshot = await (0, firestore_1.getDocs)(q);
        return snapshot.docs
            .map(doc => doc.data())
            .filter(duel => duel.challenger === userId || duel.challenged === userId);
    }
}
exports.DuelService = DuelService;
exports.duelService = new DuelService();
