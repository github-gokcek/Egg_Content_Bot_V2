import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './firebase';
import { Logger } from '../utils/logger';

interface RoleConfig {
  guildId: string;
  roles: string[];
  messageId?: string;
  channelId?: string;
}

export class RoleService {
  async getRoles(guildId: string): Promise<string[]> {
    try {
      const docRef = doc(db, 'role_configs', guildId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data().roles || [];
      }
      return [];
    } catch (error) {
      Logger.error('Roller getirilemedi', error);
      return [];
    }
  }

  async addRole(guildId: string, roleId: string): Promise<boolean> {
    try {
      const docRef = doc(db, 'role_configs', guildId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          roles: arrayUnion(roleId)
        });
      } else {
        await setDoc(docRef, {
          guildId,
          roles: [roleId]
        });
      }
      
      Logger.success('Rol eklendi', { guildId, roleId });
      return true;
    } catch (error) {
      Logger.error('Rol eklenemedi', error);
      return false;
    }
  }

  async removeRole(guildId: string, roleId: string): Promise<boolean> {
    try {
      const docRef = doc(db, 'role_configs', guildId);
      await updateDoc(docRef, {
        roles: arrayRemove(roleId)
      });
      
      Logger.success('Rol çıkarıldı', { guildId, roleId });
      return true;
    } catch (error) {
      Logger.error('Rol çıkarılamadı', error);
      return false;
    }
  }

  async saveMessage(guildId: string, messageId: string, channelId: string): Promise<void> {
    try {
      const docRef = doc(db, 'role_configs', guildId);
      await updateDoc(docRef, {
        messageId,
        channelId
      });
      Logger.success('Rol mesajı kaydedildi', { guildId, messageId });
    } catch (error) {
      Logger.error('Rol mesajı kaydedilemedi', error);
    }
  }
}

export const roleService = new RoleService();
