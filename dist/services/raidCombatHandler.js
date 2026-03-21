"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRaidCombatButton = handleRaidCombatButton;
const discord_js_1 = require("discord.js");
const rpgService_1 = require("./rpgService");
const combatService_1 = require("./combatService");
const raidService_1 = require("./raidService");
const firebase_1 = require("./firebase");
const firestore_1 = require("firebase/firestore");
const enemyService_1 = require("./enemyService");
async function handleRaidCombatButton(interaction) {
    const parts = interaction.customId.split('_');
    // customId format: raid_attack_raid_1234567890 veya raid_defend_raid_1234567890
    const actionType = parts[1]; // attack veya defend
    const raidId = parts.slice(2).join('_'); // raid_1234567890
    console.log('Raid button clicked:', { customId: interaction.customId, actionType, raidId });
    // Get raid combat
    const raidDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'activeRaids', raidId));
    if (!raidDoc.exists()) {
        console.log('Raid not found:', raidId);
        return interaction.reply({
            content: '❌ Bu raid artık aktif değil!',
            ephemeral: true
        });
    }
    const raid = raidDoc.data();
    // Check if it's this user's turn
    if (raid.currentTurnUserId !== interaction.user.id) {
        return interaction.reply({
            content: `❌ Şu an senin turun değil! <@${raid.currentTurnUserId}> oynuyor.`,
            ephemeral: true
        });
    }
    const currentBoss = raid.bosses[raid.currentBossIndex];
    // Get character
    const character = await rpgService_1.rpgService.getCharacter(interaction.user.id);
    if (!character) {
        return interaction.reply({
            content: '❌ Karakter bulunamadı!',
            ephemeral: true
        });
    }
    const characterStats = rpgService_1.rpgService.calculateDerivedStats(character);
    const userState = raid.participantStates[interaction.user.id];
    // Handle item action BEFORE deferUpdate (needs reply, not update)
    if (actionType === 'item') {
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
            .setCustomId(`raid_use_item_${raidId}`)
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
    await interaction.deferUpdate();
    // Handle action
    if (actionType === 'attack') {
        const turn = combatService_1.CombatService.executeTurn(character, characterStats, currentBoss, { type: 'attack' }, userState.isDefending);
        raid.turnCount++;
        userState.isDefending = false;
        userState.hp = Math.max(0, character.currentHp);
        // Add to combat log
        const logEntry = `**Turn ${raid.turnCount}** - <@${interaction.user.id}> attacked ${currentBoss.name}!\n` +
            `> ⚔️ Dealt ${turn.playerDamage} damage${turn.isCrit ? ' (CRIT!)' : ''}${turn.isDodged ? ' (DODGED!)' : ''}\n` +
            `> 💔 Took ${turn.enemyDamage} damage`;
        raid.combatLog.push(logEntry);
        // Check if boss defeated
        if (currentBoss.hp <= 0) {
            raid.currentBossIndex++;
            // Check if all bosses defeated
            if (raid.currentBossIndex >= raid.bosses.length) {
                // RAID COMPLETE!
                await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'activeRaids', raidId));
                // Raid sayısını artır (tüm katılımcılar için)
                for (const userId of raid.participants) {
                    const char = await rpgService_1.rpgService.getCharacter(userId);
                    if (char) {
                        // Günlük raid sayısını artır
                        const now = new Date();
                        const lastReset = char.lastRaidReset ? new Date(char.lastRaidReset) : null;
                        // Gün değişti mi kontrol et
                        if (lastReset &&
                            (lastReset.getDate() !== now.getDate() ||
                                lastReset.getMonth() !== now.getMonth() ||
                                lastReset.getFullYear() !== now.getFullYear())) {
                            // Yeni gün, sayıcıyı sıfırla
                            char.dailyRaidCount = 1;
                            char.lastRaidReset = now;
                        }
                        else {
                            // Aynı gün, sayıcıyı artır
                            char.dailyRaidCount = (char.dailyRaidCount || 0) + 1;
                            char.lastRaidReset = now;
                        }
                        await rpgService_1.rpgService.updateCharacter(char);
                    }
                }
                // Distribute rewards to all participants
                const rewardEmbeds = await distributeRaidRewards(raid, currentBoss);
                const victoryEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(0x00ff00)
                    .setTitle('🎉 RAID COMPLETE!')
                    .setDescription(`The raid party defeated all bosses!`)
                    .addFields({ name: '🏆 Final Boss', value: currentBoss.name, inline: true }, { name: '⚔️ Total Turns', value: raid.turnCount.toString(), inline: true }, { name: '👥 Survivors', value: Object.values(raid.participantStates).filter(s => s.hp > 0).length.toString(), inline: true })
                    .setTimestamp();
                return interaction.editReply({ embeds: [victoryEmbed, ...rewardEmbeds], components: [] });
            }
            // Next boss
            const nextBoss = raid.bosses[raid.currentBossIndex];
            raid.combatLog.push(`\n🔥 **${nextBoss.name}** appeared!\n`);
        }
        // Check if player died
        if (character.currentHp <= 0) {
            raid.combatLog.push(`💀 <@${interaction.user.id}> was defeated!`);
            // Remove from turn order
            raid.turnOrder = raid.turnOrder.filter(id => id !== interaction.user.id);
            // Check if all players dead
            if (raid.turnOrder.length === 0) {
                await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'activeRaids', raidId));
                const defeatEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('💀 RAID FAILED!')
                    .setDescription('All party members were defeated...')
                    .setTimestamp();
                return interaction.editReply({ embeds: [defeatEmbed], components: [] });
            }
        }
        // Next turn
        raid.currentTurnUserId = raidService_1.RaidService.getNextTurnUser(raid.currentTurnUserId, raid.turnOrder);
        await updateRaidEmbed(interaction, raid);
        // Update raid in Firebase
        await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'activeRaids', raidId), {
            currentBossIndex: raid.currentBossIndex,
            bosses: raid.bosses,
            currentTurnUserId: raid.currentTurnUserId,
            turnOrder: raid.turnOrder,
            turnCount: raid.turnCount,
            participantStates: raid.participantStates,
            combatLog: raid.combatLog
        });
    }
    else if (actionType === 'defend') {
        const turn = combatService_1.CombatService.executeTurn(character, characterStats, currentBoss, { type: 'defend' }, true);
        raid.turnCount++;
        userState.isDefending = true;
        userState.hp = Math.max(0, character.currentHp);
        const logEntry = `**Turn ${raid.turnCount}** - <@${interaction.user.id}> defended!\n` +
            `> 🛡️ Reduced damage by 50%\n` +
            `> 💔 Took ${turn.enemyDamage} damage`;
        raid.combatLog.push(logEntry);
        if (character.currentHp <= 0) {
            raid.combatLog.push(`💀 <@${interaction.user.id}> was defeated!`);
            raid.turnOrder = raid.turnOrder.filter(id => id !== interaction.user.id);
            if (raid.turnOrder.length === 0) {
                await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'activeRaids', raidId));
                const defeatEmbed = new discord_js_1.EmbedBuilder()
                    .setColor(0xff0000)
                    .setTitle('💀 RAID FAILED!')
                    .setDescription('All party members were defeated...')
                    .setTimestamp();
                return interaction.editReply({ embeds: [defeatEmbed], components: [] });
            }
        }
        raid.currentTurnUserId = raidService_1.RaidService.getNextTurnUser(raid.currentTurnUserId, raid.turnOrder);
        await updateRaidEmbed(interaction, raid);
        // Update raid in Firebase
        await (0, firestore_1.updateDoc)((0, firestore_1.doc)(firebase_1.db, 'activeRaids', raidId), {
            currentBossIndex: raid.currentBossIndex,
            bosses: raid.bosses,
            currentTurnUserId: raid.currentTurnUserId,
            turnOrder: raid.turnOrder,
            turnCount: raid.turnCount,
            participantStates: raid.participantStates,
            combatLog: raid.combatLog
        });
    }
}
async function updateRaidEmbed(interaction, raid) {
    const currentBoss = raid.bosses[raid.currentBossIndex];
    const enemyEmoji = enemyService_1.EnemyGenerator.getEnemyEmoji(currentBoss.name);
    const enemyHpBar = combatService_1.CombatService.createHPBar(currentBoss.hp, currentBoss.maxHp, 15);
    // Get all participant HP bars
    const participantInfo = await Promise.all(raid.participants.map(async (userId) => {
        const char = await rpgService_1.rpgService.getCharacter(userId);
        if (!char)
            return null;
        const stats = rpgService_1.rpgService.calculateDerivedStats(char);
        const state = raid.participantStates[userId];
        const hp = Math.max(0, state.hp);
        const hpBar = combatService_1.CombatService.createHPBar(hp, stats.maxHp, 10);
        const isTurn = raid.currentTurnUserId === userId;
        return `${isTurn ? '▶️' : '⏸️'} <@${userId}>\n❤️ ${hpBar} ${hp}/${stats.maxHp}`;
    }));
    const validParticipants = participantInfo.filter(p => p !== null);
    // Get last 5 combat log entries
    const recentLogs = raid.combatLog.slice(-5).join('\n\n');
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0xff0000)
        .setTitle(`${enemyEmoji} RAID COMBAT - Boss ${raid.currentBossIndex + 1}/3`)
        .setDescription(`**${currentBoss.name}**\n\n` +
        '```\n' +
        `${enemyEmoji} ${currentBoss.name}\n` +
        `❤️ HP: ${enemyHpBar} ${currentBoss.hp}/${currentBoss.maxHp}\n` +
        `⚔️ ATK: ${currentBoss.attack} | 🛡️ DEF: ${currentBoss.defense}\n` +
        '```\n\n' +
        '**👥 Party Status:**\n' +
        validParticipants.join('\n\n'))
        .addFields({ name: '📜 Combat Log', value: recentLogs || 'Combat started!', inline: false }, { name: '🎯 Current Turn', value: `<@${raid.currentTurnUserId}> - Choose your action!`, inline: false })
        .setFooter({ text: `Turn ${raid.turnCount} | Only the current player can act!` })
        .setTimestamp();
    const row = new discord_js_1.ActionRowBuilder()
        .addComponents(new discord_js_1.ButtonBuilder()
        .setCustomId(`raid_attack_${raid.id}`)
        .setLabel('⚔️ Attack')
        .setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
        .setCustomId(`raid_defend_${raid.id}`)
        .setLabel('🛡️ Defend')
        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
        .setCustomId(`raid_item_${raid.id}`)
        .setLabel('🧪 Item')
        .setStyle(discord_js_1.ButtonStyle.Success));
    await interaction.editReply({ embeds: [embed], components: [row] });
    // Update all characters
    for (const userId of raid.participants) {
        const char = await rpgService_1.rpgService.getCharacter(userId);
        if (char) {
            char.currentHp = raid.participantStates[userId].hp;
            await rpgService_1.rpgService.updateCharacter(char);
        }
    }
}
async function distributeRaidRewards(raid, finalBoss) {
    const embeds = [];
    for (const userId of raid.participants) {
        const character = await rpgService_1.rpgService.getCharacter(userId);
        if (!character)
            continue;
        // Calculate rewards (each boss gives rewards)
        let totalXP = 0;
        let totalCoins = 0;
        const allLoot = [];
        for (const boss of raid.bosses) {
            totalXP += boss.xpReward;
            totalCoins += boss.coinReward;
            // Process loot from each boss
            for (const loot of boss.lootTable) {
                const roll = Math.random() * 100;
                if (roll < loot.chance) {
                    const amount = Math.floor(Math.random() * (loot.maxAmount - loot.minAmount + 1) + loot.minAmount);
                    // Add to loot list
                    const existingLoot = allLoot.find(l => l.itemId === loot.itemId);
                    if (existingLoot) {
                        existingLoot.amount += amount;
                    }
                    else {
                        allLoot.push({ itemId: loot.itemId, amount });
                    }
                    // Add to inventory
                    const existingItem = character.inventory.find(i => i.itemId === loot.itemId && !i.equipped);
                    if (existingItem) {
                        existingItem.amount += amount;
                    }
                    else {
                        character.inventory.push({
                            itemId: loot.itemId,
                            amount: amount,
                            equipped: false
                        });
                    }
                }
            }
        }
        character.xp += totalXP;
        character.rpgCoin += totalCoins;
        character.raidsCompleted++;
        character.totalKills += 3; // 3 bosses
        // Check level up
        let leveledUp = false;
        let newLevel = character.level;
        while (character.xp >= character.xpToNextLevel) {
            character.xp -= character.xpToNextLevel;
            character.level++;
            newLevel = character.level;
            leveledUp = true;
            // Increase stats
            character.stats.str += 2;
            character.stats.dex += 2;
            character.stats.int += 2;
            character.stats.vit += 2;
            character.stats.agi += 2;
            character.xpToNextLevel = Math.floor(100 * Math.pow(character.level, 1.5));
            // Heal to full
            const derivedStats = rpgService_1.rpgService.calculateDerivedStats(character);
            character.currentHp = derivedStats.maxHp;
            character.currentMana = derivedStats.maxMana;
        }
        await rpgService_1.rpgService.updateCharacter(character);
        const rewardEmbed = new discord_js_1.EmbedBuilder()
            .setColor(0xffd700)
            .setTitle(`🎁 Rewards - ${character.name}`);
        const fields = [
            { name: '📈 XP Gained', value: `+${totalXP} XP`, inline: true },
            { name: '💰 Coins Gained', value: `+${totalCoins} RPG Coin`, inline: true },
            { name: '⭐ Level', value: character.level.toString(), inline: true }
        ];
        if (leveledUp) {
            fields.push({ name: '🎉 LEVEL UP!', value: `Reached Level ${newLevel}!`, inline: false });
        }
        if (allLoot.length > 0) {
            const lootText = allLoot.map(l => `• ${l.itemId} x${l.amount}`).join('\n');
            fields.push({ name: '🎁 Loot', value: lootText, inline: false });
        }
        rewardEmbed.addFields(fields);
        embeds.push(rewardEmbed);
    }
    return embeds;
}
