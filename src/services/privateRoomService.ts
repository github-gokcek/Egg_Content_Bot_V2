import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

interface PrivateRoomConfig {
  guildId: string;
  triggerChannelId: string;
  categoryId?: string;
}

interface PrivateRoomData {
  channelId: string;
  ownerId: string;
  guildId: string;
}

export class PrivateRoomService {
  private static instance: PrivateRoomService;
  private rooms: Map<string, PrivateRoomData> = new Map();

  static getInstance(): PrivateRoomService {
    if (!PrivateRoomService.instance) {
      PrivateRoomService.instance = new PrivateRoomService();
    }
    return PrivateRoomService.instance;
  }

  async setTriggerChannel(guildId: string, channelId: string): Promise<void> {
    const config: PrivateRoomConfig = { guildId, triggerChannelId: channelId };
    await setDoc(doc(db, 'private_room_configs', guildId), config);
  }

  async getTriggerChannel(guildId: string): Promise<string | null> {
    const docRef = doc(db, 'private_room_configs', guildId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as PrivateRoomConfig).triggerChannelId : null;
  }

  async setCategoryId(guildId: string, categoryId: string): Promise<void> {
    await updateDoc(doc(db, 'private_room_configs', guildId), { categoryId });
  }

  async getCategoryId(guildId: string): Promise<string | null> {
    const docRef = doc(db, 'private_room_configs', guildId);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data() as PrivateRoomConfig;
    return data?.categoryId || null;
  }

  addRoom(channelId: string, ownerId: string, guildId: string): void {
    this.rooms.set(channelId, { channelId, ownerId, guildId });
  }

  removeRoom(channelId: string): void {
    this.rooms.delete(channelId);
  }

  isPrivateRoom(channelId: string): boolean {
    return this.rooms.has(channelId);
  }

  getOwner(channelId: string): string | null {
    return this.rooms.get(channelId)?.ownerId || null;
  }

  getRoomsByGuild(guildId: string): string[] {
    return Array.from(this.rooms.values())
      .filter(room => room.guildId === guildId)
      .map(room => room.channelId);
  }
}
