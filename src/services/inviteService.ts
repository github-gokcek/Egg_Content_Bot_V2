import { db } from './firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { Logger } from '../utils/logger';

interface GroupInvite {
  groupId: string;
  invitedUserId: string;
  invitedBy: string;
  createdAt: Date;
}

export class InviteService {
  async createInvite(groupId: string, invitedUserId: string, invitedBy: string): Promise<string> {
    const inviteId = `${groupId}_${invitedUserId}_${Date.now()}`;
    
    await setDoc(doc(db, 'invites', inviteId), {
      groupId,
      invitedUserId,
      invitedBy,
      createdAt: new Date()
    });

    Logger.info('Grup daveti oluşturuldu', { inviteId, groupId, invitedUserId });
    return inviteId;
  }

  async getInvite(inviteId: string): Promise<GroupInvite | null> {
    const docSnap = await getDoc(doc(db, 'invites', inviteId));
    return docSnap.exists() ? docSnap.data() as GroupInvite : null;
  }

  async deleteInvite(inviteId: string): Promise<void> {
    await deleteDoc(doc(db, 'invites', inviteId));
  }
}

export const inviteService = new InviteService();
