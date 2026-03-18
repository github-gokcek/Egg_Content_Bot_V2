import { RPGCharacter, RPGStats } from '../types/rpg';
import { rpgService } from './rpgService';
import { getItem } from '../data/items';
import { Logger } from '../utils/logger';

export class EquipmentService {
  // Equip item
  static async equipItem(character: RPGCharacter, itemId: string): Promise<{ success: boolean; message: string }> {
    const item = getItem(itemId);
    
    if (!item) {
      return { success: false, message: '❌ Item bulunamadı!' };
    }

    if (item.type !== 'weapon' && item.type !== 'armor' && item.type !== 'accessory') {
      return { success: false, message: '❌ Bu item kuşanılamaz!' };
    }

    // Check if item is in inventory
    const inventoryItem = character.inventory.find(i => i.itemId === itemId && !i.equipped);
    if (!inventoryItem) {
      return { success: false, message: '❌ Bu item envanterde yok!' };
    }

    // Check level requirement
    if (character.level < item.level) {
      return { success: false, message: `❌ Bu item için Level ${item.level} gerekli!` };
    }

    // Unequip current item in slot
    const slot = item.type === 'weapon' ? 'weapon' : item.type === 'armor' ? 'armor' : 'accessory';
    const currentEquipped = character.equipment[slot];
    
    if (currentEquipped) {
      // Move current item back to inventory
      const currentInvItem = character.inventory.find(i => i.itemId === currentEquipped && i.equipped);
      if (currentInvItem) {
        currentInvItem.equipped = false;
      }
    }

    // Equip new item
    character.equipment[slot] = itemId;
    inventoryItem.equipped = true;

    await rpgService.updateCharacter(character);
    Logger.success('Item equipped', { userId: character.userId, itemId });

    return { success: true, message: `✅ **${item.name}** kuşandın!` };
  }

  // Unequip item
  static async unequipItem(character: RPGCharacter, slot: 'weapon' | 'armor' | 'accessory'): Promise<{ success: boolean; message: string }> {
    const equippedItemId = character.equipment[slot];
    
    if (!equippedItemId) {
      return { success: false, message: '❌ Bu slotta kuşanılı item yok!' };
    }

    const item = getItem(equippedItemId);
    if (!item) {
      return { success: false, message: '❌ Item bulunamadı!' };
    }

    // Unequip
    character.equipment[slot] = undefined;
    
    // Mark as not equipped in inventory
    const inventoryItem = character.inventory.find(i => i.itemId === equippedItemId && i.equipped);
    if (inventoryItem) {
      inventoryItem.equipped = false;
    }

    await rpgService.updateCharacter(character);
    Logger.success('Item unequipped', { userId: character.userId, itemId: equippedItemId });

    return { success: true, message: `✅ **${item.name}** çıkardın!` };
  }

  // Calculate equipment bonuses
  static calculateEquipmentBonuses(character: RPGCharacter): RPGStats {
    const bonuses: RPGStats = {
      str: 0,
      dex: 0,
      int: 0,
      vit: 0,
      agi: 0
    };

    // Weapon
    if (character.equipment.weapon) {
      const weapon = getItem(character.equipment.weapon);
      if (weapon && weapon.stats) {
        bonuses.str += weapon.stats.str || 0;
        bonuses.dex += weapon.stats.dex || 0;
        bonuses.int += weapon.stats.int || 0;
        bonuses.vit += weapon.stats.vit || 0;
        bonuses.agi += weapon.stats.agi || 0;
      }
    }

    // Armor
    if (character.equipment.armor) {
      const armor = getItem(character.equipment.armor);
      if (armor && armor.stats) {
        bonuses.str += armor.stats.str || 0;
        bonuses.dex += armor.stats.dex || 0;
        bonuses.int += armor.stats.int || 0;
        bonuses.vit += armor.stats.vit || 0;
        bonuses.agi += armor.stats.agi || 0;
      }
    }

    // Accessory
    if (character.equipment.accessory) {
      const accessory = getItem(character.equipment.accessory);
      if (accessory && accessory.stats) {
        bonuses.str += accessory.stats.str || 0;
        bonuses.dex += accessory.stats.dex || 0;
        bonuses.int += accessory.stats.int || 0;
        bonuses.vit += accessory.stats.vit || 0;
        bonuses.agi += accessory.stats.agi || 0;
      }
    }

    return bonuses;
  }
}
