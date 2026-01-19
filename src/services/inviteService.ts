import { Logger } from '../utils/logger';

interface GroupInvite {
  groupId: string;
  invitedUserId: string;
  invitedBy: string;
  createdAt: Date;
}

export class InviteService {
  private invites: Map<string, GroupInvite> = new Map(); // inviteId -> invite

  createInvite(groupId: string, invitedUserId: string, invitedBy: string): string {
    const inviteId = `${groupId}_${invitedUserId}_${Date.now()}`;
    
    this.invites.set(inviteId, {
      groupId,
      invitedUserId,
      invitedBy,
      createdAt: new Date()
    });

    Logger.info('Grup daveti oluşturuldu', { inviteId, groupId, invitedUserId });
    return inviteId;
  }

  getInvite(inviteId: string): GroupInvite | undefined {
    return this.invites.get(inviteId);
  }

  deleteInvite(inviteId: string): void {
    this.invites.delete(inviteId);
  }
}

export const inviteService = new InviteService();
