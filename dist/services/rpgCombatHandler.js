"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCombatButton = handleCombatButton;
const discord_js_1 = require("discord.js");
const rpgService_1 = require("./rpgService");
const combatService_1 = require("./combatService");
const enemyService_1 = require("./enemyService");
const firebase_1 = require("./firebase");
const firestore_1 = require("firebase/firestore");
async function handleCombatButton(interaction) {
    const [action, actionType, enemyId] = interaction.customId.split('_');
    // Get active combat
    const combatDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'activeCombats', interaction.user.id));
    if (!combatDoc.exists()) {
        return interaction.reply({
            content: '❌ Bu savaş artık aktif değil!',
            ephemeral: true
        });
    }
    const combat = combatDoc.data();
    const enemy = combat.enemy;
    // Get character
    const character = await rpgService_1.rpgService.getCharacter(interaction.user.id);
    if (!character) {
        return interaction.reply({
            content: '❌ Karakter bulunamadı!',
            ephemeral: true
        });
    }
    const characterStats = rpgService_1.rpgService.calculateDerivedStats(character);
    await interaction.deferUpdate();
    // Handle action
    if (actionType === 'attack') {
        // Execute attack turn
        const turn = combatService_1.CombatService.executeTurn(character, characterStats, enemy, { type: 'attack' }, false);
        combat.turnCount++;
        combat.isDefending = false;
        // Generate combat log
        const combatLog = combatService_1.CombatService.generateCombatLog(turn, combat.turnCount);
        // Check if combat ended
        if (enemy.hp <= 0) {
            // Victory!
            await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'activeCombats', interaction.user.id));
            const result = await combatService_1.CombatService.processCombatResult(character, enemy, true);
            const victoryEmbed = new discord_js_1.EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('🎉 VICTORY!')
                .setDescription(`You defeated **${enemy.name}**!`)
                .addFields({
                name: '📈 Rewards',
                value: `\`\`\`\n+${result.xpGained} XP\n+${result.coinGained} RPG Coin\n\`\`\``,
                inline: true
            }, {
                name: '💪 Your Stats',
                value: `HP: ${character.currentHp}/${characterStats.maxHp}\nLevel: ${character.level}`,
                inline: true
            })
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
            await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'activeCombats', interaction.user.id));
            await combatService_1.CombatService.processCombatResult(character, enemy, false);
            const defeatEmbed = new discord_js_1.EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('💀 DEFEAT!')
                .setDescription(`You were defeated by **${enemy.name}**...`)
                .addFields({ name: '💔 Result', value: 'You respawned with 50% HP.', inline: false })
                .setFooter({ text: `You survived ${combat.turnCount} turns` })
                .setTimestamp();
            return interaction.editReply({ embeds: [defeatEmbed], components: [] });
        }
        // Continue combat - update embed
        await updateCombatEmbed(interaction, character, characterStats, enemy, combat, combatLog);
        await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'activeCombats', interaction.user.id), {
            enemy: enemy,
            turnCount: combat.turnCount,
            isDefending: combat.isDefending
        });
    }
    else if (actionType === 'defend') {
        // Execute defend turn
        const turn = combatService_1.CombatService.executeTurn(character, characterStats, enemy, { type: 'defend' }, true);
        combat.turnCount++;
        combat.isDefending = true;
        const combatLog = combatService_1.CombatService.generateCombatLog(turn, combat.turnCount);
        if (character.currentHp <= 0) {
            // Defeat!
            await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'activeCombats', interaction.user.id));
            await combatService_1.CombatService.processCombatResult(character, enemy, false);
            const defeatEmbed = new discord_js_1.EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('💀 DEFEAT!')
                .setDescription(`You were defeated by **${enemy.name}**...`)
                .addFields({ name: '💔 Result', value: 'You respawned with 50% HP.', inline: false })
                .setTimestamp();
            return interaction.editReply({ embeds: [defeatEmbed], components: [] });
        }
        await updateCombatEmbed(interaction, character, characterStats, enemy, combat, combatLog);
        await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'activeCombats', interaction.user.id), {
            enemy: enemy,
            turnCount: combat.turnCount,
            isDefending: combat.isDefending
        });
    }
    else if (actionType === 'flee') {
        // Attempt to flee
        const fleeSuccess = combatService_1.CombatService.attemptFlee(characterStats.speed, enemy.speed);
        await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'activeCombats', interaction.user.id));
        if (fleeSuccess) {
            const fleeEmbed = new discord_js_1.EmbedBuilder()
                .setColor(0xffff00)
                .setTitle('🏃 FLED!')
                .setDescription(`You successfully escaped from **${enemy.name}**!`)
                .addFields({ name: '💨 Result', value: 'You ran away safely. No rewards gained.', inline: false })
                .setTimestamp();
            return interaction.editReply({ embeds: [fleeEmbed], components: [] });
        }
        else {
            // Failed to flee - enemy gets free attack
            const turn = combatService_1.CombatService.executeTurn(character, characterStats, enemy, { type: 'flee' }, false);
            if (character.currentHp <= 0) {
                await combatService_1.CombatService.processCombatResult(character, enemy, false);
                const defeatEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('💀 DEFEAT!')
                    .setDescription(`You failed to escape and were defeated by **${enemy.name}**...`)
                    .addFields({ name: '💔 Result', value: 'You respawned with 50% HP.', inline: false })
                    .setTimestamp();
                return interaction.editReply({ embeds: [defeatEmbed], components: [] });
            }
            const failEmbed = new discord_js_1.EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('❌ FLEE FAILED!')
                .setDescription(`You failed to escape! **${enemy.name}** attacks!`)
                .addFields({ name: '💔 Damage Taken', value: `${turn.enemyDamage} damage`, inline: false }, { name: '❤️ Your HP', value: `${character.currentHp}/${characterStats.maxHp}`, inline: false })
                .setTimestamp();
            await rpgService_1.rpgService.updateCharacter(character);
            return interaction.editReply({ embeds: [failEmbed], components: [] });
        }
    }
    else if (actionType === 'item') {
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
            .addOptions(consumables.slice(0, 25).map(inv => {
            const { getItem } = require('../data/items');
            const item = getItem(inv.itemId);
            return {
                label: `${item.name} x${inv.amount}`,
                value: inv.itemId,
                description: item.description
            };
        }));
        const row = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
        return interaction.reply({
            content: 'Item seç:',
            components: [row],
            ephemeral: true
        });
    }
}
async function updateCombatEmbed(interaction, character, characterStats, enemy, combat, combatLog) {
    const hpBar = combatService_1.CombatService.createHPBar(character.currentHp, characterStats.maxHp, 10);
    const enemyHpBar = combatService_1.CombatService.createHPBar(enemy.hp, enemy.maxHp, 10);
    const enemyEmoji = enemyService_1.EnemyGenerator.getEnemyEmoji(enemy.name);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0xff0000)
        .setTitle(`${enemyEmoji} COMBAT - Turn ${combat.turnCount}`)
        .setDescription(`**${enemy.name}**\\n\\n` +
        '```\\n' +
        `${enemyEmoji} ${enemy.name}\\n` +
        `❤️ HP: ${enemyHpBar} ${enemy.hp}/${enemy.maxHp}\\n` +
        '```\\n\\n' +
        '```\\n' +
        `⚔️ Your Character\\n` +
        `❤️ HP: ${hpBar} ${character.currentHp}/${characterStats.maxHp}\\n` +
        `💙 MP: ${character.currentMana}/${characterStats.maxMana}\\n` +
        '```')
        .addFields({ name: '📜 Combat Log', value: combatLog, inline: false })
        .setFooter({ text: 'Choose your next action!' })
        .setTimestamp();
    const row1 = new discord_js_1.ActionRowBuilder()
        .addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`combat_attack_${enemy.id}`)
        .setLabel('⚔️ Attack')
        .setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
        .setCustomId(`combat_defend_${enemy.id}`)
        .setLabel('🛡️ Defend')
        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
        .setCustomId(`combat_flee_${enemy.id}`)
        .setLabel('🏃 Flee')
        .setStyle(discord_js_1.ButtonStyle.Secondary));
    await interaction.editReply({ embeds: [embed], components: [row1] });
    await rpgService_1.rpgService.updateCharacter(character);
}
