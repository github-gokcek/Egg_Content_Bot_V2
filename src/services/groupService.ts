import { Logger } from '../utils/logger';

interface Group {
  id: string;
  name: string;
  members: string[];
  createdAt: Date;
}

export class GroupService {
  private groups: Map<string, Group> = new Map();
  private userGroups: Map<string, string> = new Map(); // userId -> groupId

  createGroup(leaderId: string, name: string): Group {
    if (this.userGroups.has(leaderId)) {
      throw new Error('Zaten bir gruptasınız!');
    }

    const group: Group = {
      id: Date.now().toString(),
      name,
      members: [leaderId],
      createdAt: new Date()
    };

    this.groups.set(group.id, group);
    this.userGroups.set(leaderId, group.id);
    Logger.success('Grup oluşturuldu', { groupId: group.id, name, leader: leaderId });
    return group;
  }

  getGroup(groupId: string): Group | undefined {
    return this.groups.get(groupId);
  }

  getUserGroup(userId: string): Group | undefined {
    const groupId = this.userGroups.get(userId);
    return groupId ? this.groups.get(groupId) : undefined;
  }

  addMember(groupId: string, userId: string): boolean {
    const group = this.groups.get(groupId);
    if (!group) return false;

    if (this.userGroups.has(userId)) {
      throw new Error('Kullanıcı zaten bir grupta!');
    }

    if (group.members.length >= 5) {
      throw new Error('Grup dolu! (Max 5 kişi)');
    }

    group.members.push(userId);
    this.userGroups.set(userId, groupId);
    Logger.info('Gruba üye eklendi', { groupId, userId });
    return true;
  }

  leaveGroup(userId: string): boolean {
    const groupId = this.userGroups.get(userId);
    if (!groupId) return false;

    const group = this.groups.get(groupId);
    if (!group) return false;

    group.members = group.members.filter(m => m !== userId);
    this.userGroups.delete(userId);

    // Grup boşaldı mı?
    if (group.members.length === 0) {
      this.groups.delete(groupId);
      Logger.info('Grup silindi (boş)', { groupId });
    } else {
      Logger.info('Kullanıcı gruptan ayrıldı', { groupId, userId });
    }

    return true;
  }

  getUniqueGroupId(memberIds: string[]): string {
    const sorted = [...memberIds].sort().join('-');
    return sorted;
  }

  isInGroup(userId: string): boolean {
    return this.userGroups.has(userId);
  }
}

export const groupService = new GroupService();
