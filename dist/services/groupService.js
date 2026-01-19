"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupService = exports.GroupService = void 0;
const firebase_1 = require("./firebase");
const firestore_1 = require("firebase/firestore");
const logger_1 = require("../utils/logger");
class GroupService {
    async createGroup(leaderId, name) {
        const userGroup = await this.getUserGroup(leaderId);
        if (userGroup) {
            throw new Error('Zaten bir gruptasınız!');
        }
        const group = {
            id: Date.now().toString(),
            name,
            members: [leaderId],
            createdAt: new Date()
        };
        await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'groups', group.id), group);
        logger_1.Logger.success('Grup oluşturuldu', { groupId: group.id, name, leader: leaderId });
        return group;
    }
    async getGroup(groupId) {
        const docSnap = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'groups', groupId));
        return docSnap.exists() ? docSnap.data() : null;
    }
    async getUserGroup(userId) {
        const snapshot = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebase_1.db, 'groups'));
        for (const docSnap of snapshot.docs) {
            const group = docSnap.data();
            if (group.members.includes(userId)) {
                return group;
            }
        }
        return null;
    }
    async addMember(groupId, userId) {
        const group = await this.getGroup(groupId);
        if (!group)
            return false;
        const userGroup = await this.getUserGroup(userId);
        if (userGroup) {
            throw new Error('Kullanıcı zaten bir grupta!');
        }
        if (group.members.length >= 5) {
            throw new Error('Grup dolu! (Max 5 kişi)');
        }
        group.members.push(userId);
        await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'groups', groupId), { members: group.members });
        logger_1.Logger.info('Gruba üye eklendi', { groupId, userId });
        return true;
    }
    async leaveGroup(userId) {
        const group = await this.getUserGroup(userId);
        if (!group)
            return false;
        group.members = group.members.filter(m => m !== userId);
        if (group.members.length === 0) {
            await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'groups', group.id));
            logger_1.Logger.info('Grup silindi (boş)', { groupId: group.id });
        }
        else {
            await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'groups', group.id), { members: group.members });
            logger_1.Logger.info('Kullanıcı gruptan ayrıldı', { groupId: group.id, userId });
        }
        return true;
    }
    getUniqueGroupId(memberIds) {
        const sorted = [...memberIds].sort().join('-');
        return sorted;
    }
    async isInGroup(userId) {
        const group = await this.getUserGroup(userId);
        return group !== null;
    }
}
exports.GroupService = GroupService;
exports.groupService = new GroupService();
