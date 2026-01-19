import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { Logger } from '../utils/logger';

interface Group {
  id: string;
  name: string;
  members: string[];
  createdAt: Date;
}

export class GroupService {
  async createGroup(leaderId: string, name: string): Promise<Group> {
    const userGroup = await this.getUserGroup(leaderId);
    if (userGroup) {
      throw new Error('Zaten bir gruptasınız!');
    }

    const group: Group = {
      id: Date.now().toString(),
      name,
      members: [leaderId],
      createdAt: new Date()
    };

    await setDoc(doc(db, 'groups', group.id), group);
    Logger.success('Grup oluşturuldu', { groupId: group.id, name, leader: leaderId });
    return group;
  }

  async getGroup(groupId: string): Promise<Group | null> {
    const docSnap = await getDoc(doc(db, 'groups', groupId));
    return docSnap.exists() ? docSnap.data() as Group : null;
  }

  async getUserGroup(userId: string): Promise<Group | null> {
    const snapshot = await getDocs(collection(db, 'groups'));
    for (const docSnap of snapshot.docs) {
      const group = docSnap.data() as Group;
      if (group.members.includes(userId)) {
        return group;
      }
    }
    return null;
  }

  async addMember(groupId: string, userId: string): Promise<boolean> {
    const group = await this.getGroup(groupId);
    if (!group) return false;

    const userGroup = await this.getUserGroup(userId);
    if (userGroup) {
      throw new Error('Kullanıcı zaten bir grupta!');
    }

    if (group.members.length >= 5) {
      throw new Error('Grup dolu! (Max 5 kişi)');
    }

    group.members.push(userId);
    await updateDoc(doc(db, 'groups', groupId), { members: group.members });
    Logger.info('Gruba üye eklendi', { groupId, userId });
    return true;
  }

  async leaveGroup(userId: string): Promise<boolean> {
    const group = await this.getUserGroup(userId);
    if (!group) return false;

    group.members = group.members.filter(m => m !== userId);

    if (group.members.length === 0) {
      await deleteDoc(doc(db, 'groups', group.id));
      Logger.info('Grup silindi (boş)', { groupId: group.id });
    } else {
      await updateDoc(doc(db, 'groups', group.id), { members: group.members });
      Logger.info('Kullanıcı gruptan ayrıldı', { groupId: group.id, userId });
    }

    return true;
  }

  getUniqueGroupId(memberIds: string[]): string {
    const sorted = [...memberIds].sort().join('-');
    return sorted;
  }

  async isInGroup(userId: string): Promise<boolean> {
    const group = await this.getUserGroup(userId);
    return group !== null;
  }
}

export const groupService = new GroupService();
