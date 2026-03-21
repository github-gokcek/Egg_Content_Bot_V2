"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivateRoomService = void 0;
const firebase_1 = require("./firebase");
const firestore_1 = require("firebase/firestore");
class PrivateRoomService {
    static instance;
    rooms = new Map();
    static getInstance() {
        if (!PrivateRoomService.instance) {
            PrivateRoomService.instance = new PrivateRoomService();
        }
        return PrivateRoomService.instance;
    }
    async setTriggerChannel(guildId, channelId) {
        const config = { guildId, triggerChannelId: channelId };
        await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'private_room_configs', guildId), config);
    }
    async getTriggerChannel(guildId) {
        const docRef = (0, firestore_1.doc)(firebase_1.db, 'private_room_configs', guildId);
        const docSnap = await (0, firestore_1.getDoc)(docRef);
        return docSnap.exists() ? docSnap.data().triggerChannelId : null;
    }
    async setCategoryId(guildId, categoryId) {
        await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'private_room_configs', guildId), { categoryId });
    }
    async getCategoryId(guildId) {
        const docRef = (0, firestore_1.doc)(firebase_1.db, 'private_room_configs', guildId);
        const docSnap = await (0, firestore_1.getDoc)(docRef);
        const data = docSnap.data();
        return data?.categoryId || null;
    }
    addRoom(channelId, ownerId, guildId) {
        this.rooms.set(channelId, { channelId, ownerId, guildId });
    }
    removeRoom(channelId) {
        this.rooms.delete(channelId);
    }
    isPrivateRoom(channelId) {
        return this.rooms.has(channelId);
    }
    getOwner(channelId) {
        return this.rooms.get(channelId)?.ownerId || null;
    }
    getRoomsByGuild(guildId) {
        return Array.from(this.rooms.values())
            .filter(room => room.guildId === guildId)
            .map(room => room.channelId);
    }
}
exports.PrivateRoomService = PrivateRoomService;
