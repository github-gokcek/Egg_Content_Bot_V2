"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteService = exports.InviteService = void 0;
const firebase_1 = require("./firebase");
const firestore_1 = require("firebase/firestore");
const logger_1 = require("../utils/logger");
class InviteService {
    async createInvite(groupId, invitedUserId, invitedBy) {
        const inviteId = `${groupId}_${invitedUserId}_${Date.now()}`;
        await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'invites', inviteId), {
            groupId,
            invitedUserId,
            invitedBy,
            createdAt: new Date()
        });
        logger_1.Logger.info('Grup daveti oluşturuldu', { inviteId, groupId, invitedUserId });
        return inviteId;
    }
    async getInvite(inviteId) {
        const docSnap = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'invites', inviteId));
        return docSnap.exists() ? docSnap.data() : null;
    }
    async deleteInvite(inviteId) {
        await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'invites', inviteId));
    }
}
exports.InviteService = InviteService;
exports.inviteService = new InviteService();
