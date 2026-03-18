import { RPGCharacter } from '../types/rpg';
import { rpgService } from './rpgService';
import { getItem } from '../data/items';
import { Logger } from '../utils/logger';

export class ItemService {
  // Use consumable item
  static async useItem(character: RPGCharacter, itemId: string): Promise<{ success: boolean; message: string }> {
    const item = getItem(itemId);
    
    if (!item) {
      return { success: false, message: '❌ Item bulunamadı!' };
    }

    if (item.type !== 'consumable') {
      return { success: false, message: '❌ Bu item kullanılamaz!' };
    }

    // Check if item is in inventory
    const inventoryItem = character.inventory.find(i => i.itemId === itemId && !i.equipped);
    if (!inventoryItem || inventoryItem.amount <= 0) {
      return { success: false, message: '❌ Bu item envanterde yok!' };
    }

    const stats = rpgService.calculateDerivedStats(character);
    let effectMessage = '';

    // Apply item effects
    switch (itemId) {
      case 'health_potion':
        const hpBefore = character.currentHp;
        character.currentHp = Math.min(character.currentHp + 50, stats.maxHp);
        const hpHealed = character.currentHp - hpBefore;
        effectMessage = `❤️ +${hpHealed} HP (${character.currentHp}/${stats.maxHp})`;
        break;

      case 'mana_potion':
        const manaBefore = character.currentMana;
        character.currentMana = Math.min(character.currentMana + 30, stats.maxMana);
        const manaRestored = character.currentMana - manaBefore;
        effectMessage = `💙 +${manaRestored} Mana (${character.currentMana}/${stats.maxMana})`;
        break;

      case 'elixir':
        character.currentHp = stats.maxHp;
        character.currentMana = stats.maxMana;
        effectMessage = `✨ HP ve Mana tamamen yenilendi!\n❤️ ${stats.maxHp}/${stats.maxHp}\n💙 ${stats.maxMana}/${stats.maxMana}`;
        break;

      default:
        return { success: false, message: '❌ Bu item henüz kullanılamıyor!' };
    }

    // Remove item from inventory
    inventoryItem.amount -= 1;
    if (inventoryItem.amount <= 0) {
      character.inventory = character.inventory.filter(i => i !== inventoryItem);
    }

    await rpgService.updateCharacter(character);
    Logger.success('Item used', { userId: character.userId, itemId });

    return { 
      success: true, 
      message: `✅ **${item.name}** kullandın!\n${effectMessage}` 
    };
  }

  // Use item in combat
  static async useItemInCombat(character: RPGCharacter, itemId: string): Promise<{ 
    success: boolean; 
    message: string;
    hpRestored?: number;
    manaRestored?: number;
  }> {
    const item = getItem(itemId);
    
    if (!item) {
      return { success: false, message: '❌ Item bulunamadı!' };
    }

    if (item.type !== 'consumable') {
      return { success: false, message: '❌ Bu item kullanılamaz!' };
    }

    const inventoryItem = character.inventory.find(i => i.itemId === itemId && !i.equipped);
    if (!inventoryItem || inventoryItem.amount <= 0) {
      return { success: false, message: '❌ Bu item envanterde yok!' };
    }

    const stats = rpgService.calculateDerivedStats(character);
    let hpRestored = 0;
    let manaRestored = 0;

    switch (itemId) {
      case 'health_potion':
        const hpBefore = character.currentHp;
        character.currentHp = Math.min(character.currentHp + 50, stats.maxHp);
        hpRestored = character.currentHp - hpBefore;
        break;

      case 'mana_potion':
        const manaBefore = character.currentMana;
        character.currentMana = Math.min(character.currentMana + 30, stats.maxMana);
        manaRestored = character.currentMana - manaBefore;
        break;

      case 'elixir':
        hpRestored = stats.maxHp - character.currentHp;
        manaRestored = stats.maxMana - character.currentMana;
        character.currentHp = stats.maxHp;
        character.currentMana = stats.maxMana;
        break;

      default:
        return { success: false, message: '❌ Bu item savaşta kullanılamaz!' };
    }

    // Remove item
    inventoryItem.amount -= 1;
    if (inventoryItem.amount <= 0) {
      character.inventory = character.inventory.filter(i => i !== inventoryItem);
    }

    await rpgService.updateCharacter(character);

    return { 
      success: true, 
      message: `✅ **${item.name}** kullandın!`,
      hpRestored,
      manaRestored
    };
  }
}
