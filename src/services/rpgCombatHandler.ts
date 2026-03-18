import { ButtonInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } from 'discord.js';
import { rpgService } from './rpgService';
import { CombatService } from './combatService';
import { EnemyGenerator } from './enemyService';
import { db } from './firebase';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Enemy } from '../types/rpg';
import { Logger } from '../utils/logger';
import { join } from 'path';

interface ActiveCombat {
  userId: string;
  enemy: Enemy;
  turnCount: number;
  isDefending: boolean;
  messageId: string;
  startedAt: number;
}

export async function handleCombatButton(interaction: ButtonInteraction) {
  const [action, actionType, enemyId] = interaction.customId.split('_');
  
  // Get active combat
  const combatDoc = await getDoc(doc(db, 'activeCombats', interaction.user.id));
  if (!combatDoc.exists()) {
    return interaction.reply({
      content: '❌ Bu savaş artık aktif değil!',
      ephemeral: true
    });
  }

  const combat = combatDoc.data() as ActiveCombat;
  const enemy = combat.enemy;

  // Get character
  const character = await rpgService.getCharacter(interaction.user.id);
  if (!character) {
    return interaction.reply({
      content: '❌ Karakter bulunamadı!',
      ephemeral: true
    });
  }

  const characterStats = rpgService.calculateDerivedStats(character);

  await interaction.deferUpdate();

  // Handle action
  if (actionType === 'attack') {
    // Execute attack turn
    const turn = CombatService.executeTurn(
      character,
      characterStats,
      enemy,
      { type: 'attack' },
      false
    );

    combat.turnCount++;
    combat.isDefending = false;

    // Generate combat log
    const combatLog = CombatService.generateCombatLog(turn, combat.turnCount);

    // Check if combat ended
    if (enemy.hp <= 0) {
      // Victory!
      await deleteDoc(doc(db, 'activeCombats', interaction.user.id));
      
      const result = await CombatService.processCombatResult(character, enemy, true);
      
      const victoryEmbed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('🎉 VICTORY!')
        .setDescription(`You defeated **${enemy.name}**!`)
        .addFields(
          { 
            name: '📈 Rewards', 
            value: `\`\`\`\n+${result.xpGained} XP\n+${result.coinGained} RPG Coin\n\`\`\``, 
            inline: true 
          },
          { 
            name: '💪 Your Stats', 
            value: `HP: ${character.currentHp}/${characterStats.maxHp}\nLevel: ${character.level}`, 
            inline: true 
          }
        )
        .setFooter({ text: `Combat lasted ${combat.turnCount} turns` })
        .setTimestamp();

      if (result.leveledUp) {
        victoryEmbed.addFields({
          name: '⭐ LEVEL UP!',
          value: `You reached Level ${result.newLevel}!`,
          inline: false
        });
      }

      if (result.itemsLooted.length > 0) {
        const lootText = result.itemsLooted.map(item => `• ${item.itemId} x${item.amount}`).join('\n');
        victoryEmbed.addFields({
          name: '🎁 Loot',
          value: lootText,
          inline: false
        });
      }

      return interaction.editReply({ embeds: [victoryEmbed], components: [] });
    }

    if (character.currentHp <= 0) {
      // Defeat!
      await deleteDoc(doc(db, 'activeCombats', interaction.user.id));
      
      await CombatService.processCombatResult(character, enemy, false);
      
      const defeatEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('💀 DEFEAT!')
        .setDescription(`You were defeated by **${enemy.name}**...`)
        .addFields(
          { name: '💔 Result', value: 'You respawned with 50% HP.', inline: false }
        )
        .setFooter({ text: `You survived ${combat.turnCount} turns` })
        .setTimestamp();

      return interaction.editReply({ embeds: [defeatEmbed], components: [] });
    }

    // Continue combat - update embed
    await updateCombatEmbed(interaction, character, characterStats, enemy, combat, combatLog);
    await updateDoc(doc(db, 'activeCombats', interaction.user.id), {
      enemy: enemy,
      turnCount: combat.turnCount,
      isDefending: combat.isDefending
    });

  } else if (actionType === 'defend') {
    // Execute defend turn
    const turn = CombatService.executeTurn(
      character,
      characterStats,
      enemy,
      { type: 'defend' },
      true
    );

    combat.turnCount++;
    combat.isDefending = true;

    const combatLog = CombatService.generateCombatLog(turn, combat.turnCount);

    if (character.currentHp <= 0) {
      // Defeat!
      await deleteDoc(doc(db, 'activeCombats', interaction.user.id));
      await CombatService.processCombatResult(character, enemy, false);
      
      const defeatEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('💀 DEFEAT!')
        .setDescription(`You were defeated by **${enemy.name}**...`)
        .addFields(
          { name: '💔 Result', value: 'You respawned with 50% HP.', inline: false }
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [defeatEmbed], components: [] });
    }

    await updateCombatEmbed(interaction, character, characterStats, enemy, combat, combatLog);
    await updateDoc(doc(db, 'activeCombats', interaction.user.id), {
      enemy: enemy,
      turnCount: combat.turnCount,
      isDefending: combat.isDefending
    });

  } else if (actionType === 'flee') {
    // Attempt to flee
    const fleeSuccess = CombatService.attemptFlee(characterStats.speed, enemy.speed);
    
    await deleteDoc(doc(db, 'activeCombats', interaction.user.id));

    if (fleeSuccess) {
      const fleeEmbed = new EmbedBuilder()
        .setColor(0xffff00)
        .setTitle('🏃 FLED!')
        .setDescription(`You successfully escaped from **${enemy.name}**!`)
        .addFields(
          { name: '💨 Result', value: 'You ran away safely. No rewards gained.', inline: false }
        )
        .setTimestamp();

      return interaction.editReply({ embeds: [fleeEmbed], components: [] });
    } else {
      // Failed to flee - enemy gets free attack
      const turn = CombatService.executeTurn(
        character,
        characterStats,
        enemy,
        { type: 'flee' },
        false
      );

      if (character.currentHp <= 0) {
        await CombatService.processCombatResult(character, enemy, false);
        
        const defeatEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('💀 DEFEAT!')
          .setDescription(`You failed to escape and were defeated by **${enemy.name}**...`)
          .addFields(
            { name: '💔 Result', value: 'You respawned with 50% HP.', inline: false }
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [defeatEmbed], components: [] });
      }

      const failEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ FLEE FAILED!')
        .setDescription(`You failed to escape! **${enemy.name}** attacks!`)
        .addFields(
          { name: '💔 Damage Taken', value: `${turn.enemyDamage} damage`, inline: false },
          { name: '❤️ Your HP', value: `${character.currentHp}/${characterStats.maxHp}`, inline: false }
        )
        .setTimestamp();

      await rpgService.updateCharacter(character);
      return interaction.editReply({ embeds: [failEmbed], components: [] });
    }
  } else if (actionType === 'item') {
    // Show item selection
    const consumables = character.inventory.filter(i => {
      const { getItem } = require('../data/items');
      const item = getItem(i.itemId);
      return item && item.type === 'consumable' && !i.equipped && i.amount > 0;
    });

    if (consumables.length === 0) {
      return interaction.reply({
        content: '❌ Kullanılabilir item yok!',
        ephemeral: true
      });
    }

    const { StringSelectMenuBuilder } = require('discord.js');
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`combat_use_item_${enemy.id}`)
      .setPlaceholder('Item seç...')
      .addOptions(
        consumables.slice(0, 25).map(inv => {
          const { getItem } = require('../data/items');
          const item = getItem(inv.itemId);
          return {
            label: `${item.name} x${inv.amount}`,
            value: inv.itemId,
            description: item.description
          };
        })
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);
    return interaction.reply({
      content: 'Item seç:',
      components: [row],
      ephemeral: true
    });
  }
}

async function updateCombatEmbed(
  interaction: ButtonInteraction,
  character: any,
  characterStats: any,
  enemy: Enemy,
  combat: ActiveCombat,
  combatLog: string
) {
  const hpBar = CombatService.createHPBar(character.currentHp, characterStats.maxHp, 10);
  const enemyHpBar = CombatService.createHPBar(enemy.hp, enemy.maxHp, 10);
  const enemyEmoji = EnemyGenerator.getEnemyEmoji(enemy.name);

  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle(`${enemyEmoji} COMBAT - Turn ${combat.turnCount}`)
    .setDescription(
      `**${enemy.name}**\\n\\n` +
      '```\\n' +
      `${enemyEmoji} ${enemy.name}\\n` +
      `❤️ HP: ${enemyHpBar} ${enemy.hp}/${enemy.maxHp}\\n` +
      '```\\n\\n' +
      '```\\n' +
      `⚔️ Your Character\\n` +
      `❤️ HP: ${hpBar} ${character.currentHp}/${characterStats.maxHp}\\n` +
      `💙 MP: ${character.currentMana}/${characterStats.maxMana}\\n` +
      '```'
    )
    .addFields(
      { name: '📜 Combat Log', value: combatLog, inline: false }
    )
    .setFooter({ text: 'Choose your next action!' })
    .setTimestamp();

  const row1 = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`combat_attack_${enemy.id}`)
        .setLabel('⚔️ Attack')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`combat_defend_${enemy.id}`)
        .setLabel('🛡️ Defend')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`combat_flee_${enemy.id}`)
        .setLabel('🏃 Flee')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.editReply({ embeds: [embed], components: [row1] });
  await rpgService.updateCharacter(character);
}
