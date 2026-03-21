"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleService = exports.RoleService = void 0;
const firestore_1 = require("firebase/firestore");
const firebase_1 = require("./firebase");
const logger_1 = require("../utils/logger");
class RoleService {
    async getRoles(guildId) {
        try {
            const docRef = (0, firestore_1.doc)(firebase_1.db, 'role_configs', guildId);
            const docSnap = await (0, firestore_1.getDoc)(docRef);
            if (docSnap.exists()) {
                return docSnap.data().roles || [];
            }
            return [];
        }
        catch (error) {
            logger_1.Logger.error('Roller getirilemedi', error);
            return [];
        }
    }
    async addRole(guildId, roleId) {
        try {
            const docRef = (0, firestore_1.doc)(firebase_1.db, 'role_configs', guildId);
            const docSnap = await (0, firestore_1.getDoc)(docRef);
            if (docSnap.exists()) {
                await (0, firestore_1.updateDoc)(docRef, {
                    roles: (0, firestore_1.arrayUnion)(roleId)
                });
            }
            else {
                await (0, firestore_1.setDoc)(docRef, {
                    guildId,
                    roles: [roleId]
                });
            }
            logger_1.Logger.success('Rol eklendi', { guildId, roleId });
            return true;
        }
        catch (error) {
            logger_1.Logger.error('Rol eklenemedi', error);
            return false;
        }
    }
    async removeRole(guildId, roleId) {
        try {
            const docRef = (0, firestore_1.doc)(firebase_1.db, 'role_configs', guildId);
            await (0, firestore_1.updateDoc)(docRef, {
                roles: (0, firestore_1.arrayRemove)(roleId)
            });
            logger_1.Logger.success('Rol çıkarıldı', { guildId, roleId });
            return true;
        }
        catch (error) {
            logger_1.Logger.error('Rol çıkarılamadı', error);
            return false;
        }
    }
    async saveMessage(guildId, messageId, channelId) {
        try {
            const docRef = (0, firestore_1.doc)(firebase_1.db, 'role_configs', guildId);
            await (0, firestore_1.updateDoc)(docRef, {
                messageId,
                channelId
            });
            logger_1.Logger.success('Rol mesajı kaydedildi', { guildId, messageId });
        }
        catch (error) {
            logger_1.Logger.error('Rol mesajı kaydedilemedi', error);
        }
    }
}
exports.RoleService = RoleService;
exports.roleService = new RoleService();
