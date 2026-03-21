"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const rpgService_1 = require("../services/rpgService");
const rpg_1 = require("../types/rpg");
const path_1 = require("path");
const CLASS_INFO = {
    [rpg_1.RPGClass.WARRIOR]: {
        name: '⚔️ Warrior',
        description: 'Güçlü yakın dövüş uzmanı. Yüksek HP ve savunma.',
        strengths: 'STR +40%, VIT +30%',
        weaknesses: 'INT -40%, AGI -20%'
    },
    [rpg_1.RPGClass.MAGE]: {
        name: '🔮 Mage',
        description: 'Güçlü büyü kullanıcısı. Yüksek hasar ama düşük HP.',
        strengths: 'INT +60%, AGI +10%',
        weaknesses: 'STR -40%, VIT -20%'
    },
    [rpg_1.RPGClass.ARCHER]: {
        name: '🏹 Archer',
        description: 'Uzak mesafe uzmanı. Yüksek kritik şans ve hız.',
        strengths: 'DEX +30%, AGI +40%',
        weaknesses: 'INT -30%, VIT -10%'
    },
    [rpg_1.RPGClass.ASSASSIN]: {
        name: '🗡️ Assassin',
        description: 'Hızlı ve ölümcül. En yüksek kritik ve kaçınma.',
        strengths: 'DEX +50%, AGI +60%',
        weaknesses: 'INT -30%, VIT -30%'
    },
    [rpg_1.RPGClass.CLERIC]: {
        name: '✨ Cleric',
        description: 'Destek ve iyileştirme uzmanı. Dengeli statlar.',
        strengths: 'INT +30%, VIT +20%',
        weaknesses: 'STR -20%, AGI -10%'
    }
};
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('rpg')
        .setDescription('RPG sistemi komutları')
        .addSubcommand(subcommand => subcommand
        .setName('create')
        .setDescription('Yeni bir RPG karakteri oluştur'))
        .addSubcommand(subcommand => subcommand
        .setName('profil')
        .setDescription('RPG karakterini görüntüle')
        .addUserOption(option => option
        .setName('kullanici')
        .setDescription('Görüntülenecek kullanıcı (opsiyonel)')
        .setRequired(false)))
        .addSubcommand(subcommand => subcommand
        .setName('adventure')
        .setDescription('Maceraya çık ve düşmanlarla savaş!')
        .addStringOption(option => option
        .setName('area')
        .setDescription('Macera alanı (opsiyonel)')
        .setRequired(false)
        .addChoices({ name: '🌲 Peaceful Forest (Lv.1-5)', value: 'forest' }, { name: '🌑 Dark Forest (Lv.5-10)', value: 'dark_forest' }, { name: '👻 Haunted Woods (Lv.10-15)', value: 'haunted_woods' }, { name: '☁️ Sky Realm (Lv.15-25)', value: 'sky_realm' })))
        .addSubcommand(subcommand => subcommand
        .setName('exchange')
        .setDescription('Coin dönüşümü yap')
        .addStringOption(option => option
        .setName('tip')
        .setDescription('Dönüşüm tipi')
        .setRequired(true)
        .addChoices({ name: 'Server Coin → RPG Coin', value: 'server_to_rpg' }, { name: 'RPG Coin → Server Coin', value: 'rpg_to_server' }))
        .addIntegerOption(option => option
        .setName('miktar')
        .setDescription('Dönüştürülecek miktar')
        .setRequired(true)
        .setMinValue(1)))
        .addSubcommand(subcommand => subcommand
        .setName('raid')
        .setDescription('Grup ile raid başlat (3 boss)'))
        .addSubcommand(subcommand => subcommand
        .setName('envanter')
        .setDescription('RPG envanterini görüntüle')
        .addUserOption(option => option
        .setName('kullanici')
        .setDescription('Görüntülenecek kullanıcı (opsiyonel)')
        .setRequired(false)))
        .addSubcommand(subcommand => subcommand
        .setName('shop')
        .setDescription('RPG mağazasını görüntüle'))
        .addSubcommand(subcommand => subcommand
        .setName('buy')
        .setDescription('Mağazadan item satın al')
        .addStringOption(option => option
        .setName('item')
        .setDescription('Satın alınacak item ID')
        .setRequired(true))
        .addIntegerOption(option => option
        .setName('miktar')
        .setDescription('Miktar (opsiyonel, varsayılan: 1)')
        .setRequired(false)
        .setMinValue(1)))
        .addSubcommand(subcommand => subcommand
        .setName('sell')
        .setDescription('Envanterdeki item sat')
        .addStringOption(option => option
        .setName('item')
        .setDescription('Satılacak item ID')
        .setRequired(true))
        .addIntegerOption(option => option
        .setName('miktar')
        .setDescription('Miktar (opsiyonel, varsayılan: 1)')
        .setRequired(false)
        .setMinValue(1)))
        .addSubcommand(subcommand => subcommand
        .setName('equip')
        .setDescription('Item kuşan')
        .addStringOption(option => option
        .setName('item')
        .setDescription('Kuşanılacak item ID')
        .setRequired(true)))
        .addSubcommand(subcommand => subcommand
        .setName('unequip')
        .setDescription('Item çıkar')
        .addStringOption(option => option
        .setName('slot')
        .setDescription('Slot')
        .setRequired(true)
        .addChoices({ name: '⚔️ Weapon', value: 'weapon' }, { name: '🛡️ Armor', value: 'armor' }, { name: '💍 Accessory', value: 'accessory' })))
        .addSubcommand(subcommand => subcommand
        .setName('use')
        .setDescription('Item kullan (potion, elixir)')
        .addStringOption(option => option
        .setName('item')
        .setDescription('Kullanılacak item ID')
        .setRequired(true)))
        .addSubcommand(subcommand => subcommand
        .setName('skills')
        .setDescription('Skill listeni görüntüle'))
        .addSubcommand(subcommand => subcommand
        .setName('dinlen')
        .setDescription('Dinlen ve canını doldur (%50 HP ve Mana)'))
        .addSubcommand(subcommand => subcommand
        .setName('full')
        .setDescription('[ADMIN] HP ve Mana’yı tamamen doldur')
        .addUserOption(option => option
        .setName('kullanici')
        .setDescription('Hedef kullanıcı (opsiyonel)')
        .setRequired(false))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'create') {
            await this.handleCreate(interaction);
        }
        else if (subcommand === 'profil') {
            await this.handleProfile(interaction);
        }
        else if (subcommand === 'adventure') {
            await this.handleAdventure(interaction);
        }
        else if (subcommand === 'exchange') {
            await this.handleExchange(interaction);
        }
        else if (subcommand === 'raid') {
            await this.handleRaid(interaction);
        }
        else if (subcommand === 'envanter') {
            await this.handleInventory(interaction);
        }
        else if (subcommand === 'shop') {
            const { handleShop } = await Promise.resolve().then(() => __importStar(require('../services/shopService')));
            await handleShop(interaction);
        }
        else if (subcommand === 'buy') {
            const { handleBuy } = await Promise.resolve().then(() => __importStar(require('../services/shopService')));
            await handleBuy(interaction);
        }
        else if (subcommand === 'sell') {
            const { handleSell } = await Promise.resolve().then(() => __importStar(require('../services/shopService')));
            await handleSell(interaction);
        }
        else if (subcommand === 'equip') {
            await this.handleEquip(interaction);
        }
        else if (subcommand === 'unequip') {
            await this.handleUnequip(interaction);
        }
        else if (subcommand === 'use') {
            await this.handleUse(interaction);
        }
        else if (subcommand === 'skills') {
            await this.handleSkills(interaction);
        }
        else if (subcommand === 'dinlen') {
            await this.handleRest(interaction);
        }
        else if (subcommand === 'full') {
            await this.handleFull(interaction);
        }
    },
    async handleCreate(interaction) {
        // Check if user already has a character
        const existingCharacter = await rpgService_1.rpgService.getCharacter(interaction.user.id);
        if (existingCharacter) {
            return interaction.reply({
                content: '❌ Zaten bir karakterin var! `/rpg profil` ile görüntüleyebilirsin.',
                ephemeral: true
            });
        }
        // Create class selection embed
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle('🎮 RPG Karakter Oluşturma')
            .setDescription('**Maceraya hoş geldin!**\n\n' +
            'Bir class seçerek karakterini oluştur. Her class\'ın kendine özgü güçlü ve zayıf yönleri var.\n\n' +
            '**Classlar:**')
            .addFields(Object.entries(CLASS_INFO).map(([classKey, info]) => ({
            name: info.name,
            value: `${info.description}\n✅ ${info.strengths}\n❌ ${info.weaknesses}`,
            inline: false
        })))
            .setFooter({ text: 'Aşağıdaki menüden class\'ını seç!' })
            .setTimestamp();
        // Create class selection menu
        const selectMenu = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('rpg_class_select')
            .setPlaceholder('Class seç...')
            .addOptions(Object.entries(CLASS_INFO).map(([classKey, info]) => ({
            label: info.name,
            value: classKey,
            description: info.description.substring(0, 100),
            emoji: info.name.split(' ')[0]
        })));
        const row = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    },
    async handleProfile(interaction) {
        const targetUser = interaction.options.getUser('kullanici') || interaction.user;
        const character = await rpgService_1.rpgService.getCharacter(targetUser.id);
        if (!character) {
            return interaction.reply({
                content: targetUser.id === interaction.user.id
                    ? '❌ Henüz bir karakterin yok! `/rpg create` ile oluşturabilirsin.'
                    : `❌ ${targetUser.username} henüz bir karakter oluşturmamış!`,
                ephemeral: true
            });
        }
        const derivedStats = rpgService_1.rpgService.calculateDerivedStats(character);
        const classInfo = CLASS_INFO[character.class];
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle(`${classInfo.name.split(' ')[0]} ${character.name}`)
            .setDescription(`**${classInfo.name.split(' ')[1]}** | Level ${character.level}`)
            .addFields({
            name: '📊 Stats',
            value: `**HP:** ${character.currentHp}/${derivedStats.maxHp}\n` +
                `**Mana:** ${character.currentMana}/${derivedStats.maxMana}\n` +
                `**XP:** ${character.xp}/${character.xpToNextLevel}`,
            inline: true
        }, {
            name: '⚔️ Combat',
            value: `**Attack:** ${derivedStats.attack}\n` +
                `**Magic:** ${derivedStats.magicAttack}\n` +
                `**Defense:** ${derivedStats.defense}\n` +
                `**Speed:** ${derivedStats.speed}`,
            inline: true
        }, {
            name: '🎯 Special',
            value: `**Crit:** ${derivedStats.critChance.toFixed(1)}%\n` +
                `**Dodge:** ${derivedStats.dodgeChance.toFixed(1)}%`,
            inline: true
        }, {
            name: '💎 Base Stats',
            value: `STR: ${character.stats.str} | DEX: ${character.stats.dex}\n` +
                `INT: ${character.stats.int} | VIT: ${character.stats.vit}\n` +
                `AGI: ${character.stats.agi}`,
            inline: false
        }, {
            name: '💰 Currency',
            value: `**RPG Coin:** ${character.rpgCoin} 🪙`,
            inline: true
        }, {
            name: '🎒 Inventory',
            value: `${character.inventory.length}/${character.maxInventorySize} items`,
            inline: true
        }, {
            name: '📈 Progress',
            value: `**Kills:** ${character.totalKills}\n` +
                `**Deaths:** ${character.totalDeaths}\n` +
                `**Dungeons:** ${character.dungeonsCompleted}\n` +
                `**Raids:** ${character.raidsCompleted}`,
            inline: true
        })
            .setThumbnail(targetUser.displayAvatarURL())
            .setFooter({ text: `Created ${character.createdAt.toLocaleDateString()}` })
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
    async handleExchange(interaction) {
        const type = interaction.options.getString('tip', true);
        const amount = interaction.options.getInteger('miktar', true);
        await interaction.deferReply({ flags: 64 });
        const rates = await rpgService_1.rpgService.getExchangeRates();
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xf1c40f)
            .setTitle('💱 Coin Dönüşümü')
            .setDescription('**Mevcut Kurlar:**\n' +
            `1 Server Coin = ${rates.serverToRPGRate.toFixed(2)} RPG Coin\n` +
            `1 RPG Coin = ${rates.rpgToServerRate.toFixed(2)} Server Coin\n\n` +
            `*Kurlar arz-talebe göre değişir*`);
        if (type === 'server_to_rpg') {
            const { databaseService } = await Promise.resolve().then(() => __importStar(require('../services/databaseService')));
            const player = await databaseService.getPlayer(interaction.user.id);
            if (!player || player.balance < amount) {
                return interaction.editReply({
                    content: `❌ Yetersiz Server Coin! Gerekli: ${amount} 🪙`
                });
            }
            const rpgCoinAmount = await rpgService_1.rpgService.exchangeServerToRPG(interaction.user.id, amount);
            // Deduct server coin
            player.balance -= amount;
            await databaseService.updatePlayer(player);
            // Add RPG coin
            const character = await rpgService_1.rpgService.getCharacter(interaction.user.id);
            if (!character) {
                return interaction.editReply({
                    content: '❌ Önce `/rpg create` ile karakter oluşturmalısın!'
                });
            }
            character.rpgCoin += rpgCoinAmount;
            await rpgService_1.rpgService.updateCharacter(character);
            embed.addFields({
                name: '✅ Dönüşüm Başarılı',
                value: `${amount} Server Coin → ${rpgCoinAmount} RPG Coin`,
                inline: false
            });
        }
        else {
            const character = await rpgService_1.rpgService.getCharacter(interaction.user.id);
            if (!character || character.rpgCoin < amount) {
                return interaction.editReply({
                    content: `❌ Yetersiz RPG Coin! Gerekli: ${amount} 🪙`
                });
            }
            const serverCoinAmount = await rpgService_1.rpgService.exchangeRPGToServer(interaction.user.id, amount);
            // Deduct RPG coin
            character.rpgCoin -= amount;
            await rpgService_1.rpgService.updateCharacter(character);
            // Add server coin
            const { databaseService } = await Promise.resolve().then(() => __importStar(require('../services/databaseService')));
            const player = await databaseService.getPlayer(interaction.user.id);
            if (player) {
                player.balance += serverCoinAmount;
                await databaseService.updatePlayer(player);
            }
            embed.addFields({
                name: '✅ Dönüşüm Başarılı',
                value: `${amount} RPG Coin → ${serverCoinAmount} Server Coin`,
                inline: false
            });
        }
        await interaction.editReply({ embeds: [embed] });
    },
    async handleAdventure(interaction) {
        const area = interaction.options.getString('area');
        const character = await rpgService_1.rpgService.getCharacter(interaction.user.id);
        if (!character) {
            return interaction.reply({
                content: '❌ Önce `/rpg create` ile karakter oluşturmalısın!',
                ephemeral: true
            });
        }
        if (character.lastAdventure) {
            const timeSinceLastAdventure = Date.now() - character.lastAdventure.getTime();
            const cooldown = 60 * 60 * 1000; // 1 saat
            if (timeSinceLastAdventure < cooldown) {
                const remainingTime = Math.ceil((cooldown - timeSinceLastAdventure) / 1000);
                const minutes = Math.floor(remainingTime / 60);
                const seconds = remainingTime % 60;
                return interaction.reply({
                    content: `⏰ Biraz dinlenmelisin! **${minutes}:${seconds.toString().padStart(2, '0')}** sonra tekrar maceraya çıkabilirsin.`,
                    ephemeral: true
                });
            }
        }
        await interaction.deferReply();
        const { EnemyGenerator } = await Promise.resolve().then(() => __importStar(require('../services/enemyService')));
        const enemy = EnemyGenerator.generateEnemy(character.level, area || undefined);
        const characterStats = rpgService_1.rpgService.calculateDerivedStats(character);
        if (character.currentHp <= 0) {
            character.currentHp = Math.floor(characterStats.maxHp * 0.5);
            await rpgService_1.rpgService.updateCharacter(character);
        }
        character.lastAdventure = new Date();
        await rpgService_1.rpgService.updateCharacter(character);
        const enemyImage = EnemyGenerator.getEnemyImage(enemy.name);
        const enemyEmoji = EnemyGenerator.getEnemyEmoji(enemy.name);
        const { CombatService } = await Promise.resolve().then(() => __importStar(require('../services/combatService')));
        const hpBar = CombatService.createHPBar(character.currentHp, characterStats.maxHp, 10);
        const enemyHpBar = CombatService.createHPBar(enemy.hp, enemy.maxHp, 10);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(`${enemyEmoji} ENEMY ENCOUNTER!`)
            .setDescription(`**${enemy.name}** appeared!\n\n` +
            '```\n' +
            `${enemyEmoji} ${enemy.name}\n` +
            `❤️ HP: ${enemyHpBar} ${enemy.hp}/${enemy.maxHp}\n` +
            `⚔️ ATK: ${enemy.attack} | 🛡️ DEF: ${enemy.defense} | ⚡ SPD: ${enemy.speed}\n` +
            '```\n\n' +
            '```\n' +
            `⚔️ Your Character\n` +
            `❤️ HP: ${hpBar} ${character.currentHp}/${characterStats.maxHp}\n` +
            `💙 MP: ${character.currentMana}/${characterStats.maxMana}\n` +
            '```')
            .addFields({ name: '🎯 Your Stats', value: `ATK: ${characterStats.attack} | DEF: ${characterStats.defense} | SPD: ${characterStats.speed}`, inline: false }, { name: '📜 Combat Log', value: '> Combat started! Choose your action.', inline: false })
            .setFooter({ text: 'Choose your action wisely!' })
            .setTimestamp();
        const row1 = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`combat_attack_${enemy.id}`)
            .setLabel('⚔️ Attack')
            .setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
            .setCustomId(`combat_defend_${enemy.id}`)
            .setLabel('🛡️ Defend')
            .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
            .setCustomId(`combat_item_${enemy.id}`)
            .setLabel('🧪 Item')
            .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
            .setCustomId(`combat_flee_${enemy.id}`)
            .setLabel('🏃 Flee')
            .setStyle(discord_js_1.ButtonStyle.Secondary));
        try {
            const imagePath = (0, path_1.join)(process.cwd(), 'assets', 'enemies', enemyImage);
            const attachment = new discord_js_1.AttachmentBuilder(imagePath);
            embed.setThumbnail(`attachment://${enemyImage}`);
            await interaction.editReply({
                embeds: [embed],
                components: [row1],
                files: [attachment]
            });
        }
        catch (error) {
            await interaction.editReply({ embeds: [embed], components: [row1] });
        }
        const { db } = require('../services/firebase');
        const { doc, setDoc } = require('firebase/firestore');
        const reply = await interaction.fetchReply();
        await setDoc(doc(db, 'activeCombats', interaction.user.id), {
            userId: interaction.user.id,
            enemy: enemy,
            turnCount: 0,
            isDefending: false,
            messageId: reply.id,
            startedAt: Date.now()
        });
    },
    async handleRaid(interaction) {
        // Check if user has a character
        const character = await rpgService_1.rpgService.getCharacter(interaction.user.id);
        if (!character) {
            return interaction.reply({
                content: '❌ Önce `/rpg create` ile karakter oluşturmalısın!',
                ephemeral: true
            });
        }
        // Günlük raid limiti kontrolü (2 raid/gün)
        const now = new Date();
        const lastReset = character.lastRaidReset ? new Date(character.lastRaidReset) : null;
        // Gün değişti mi kontrol et
        if (lastReset &&
            (lastReset.getDate() !== now.getDate() ||
                lastReset.getMonth() !== now.getMonth() ||
                lastReset.getFullYear() !== now.getFullYear())) {
            // Yeni gün, sayıcıyı sıfırla
            character.dailyRaidCount = 0;
            character.lastRaidReset = now;
            await rpgService_1.rpgService.updateCharacter(character);
        }
        // Raid limiti kontrolü
        if ((character.dailyRaidCount || 0) >= 2) {
            return interaction.reply({
                content: '❌ Bugün için raid limitine ulaştın! Günde maksimum **2 raid** yapılabilir. Yarın tekrar deneyebilirsin.',
                ephemeral: true
            });
        }
        // Check if user is in a group
        const { groupService } = await Promise.resolve().then(() => __importStar(require('../services/groupService')));
        const group = await groupService.getUserGroup(interaction.user.id);
        if (!group) {
            return interaction.reply({
                content: '❌ Raid başlatmak için bir grupta olmalısın! Önce `/group create` ile grup oluştur.',
                ephemeral: true
            });
        }
        // Check if all group members have characters
        const memberCharacters = await Promise.all(group.members.map(async (memberId) => {
            const char = await rpgService_1.rpgService.getCharacter(memberId);
            return { userId: memberId, character: char };
        }));
        const missingCharacters = memberCharacters.filter(m => !m.character);
        if (missingCharacters.length > 0) {
            const missingUsers = missingCharacters.map(m => `<@${m.userId}>`).join(', ');
            return interaction.reply({
                content: `❌ Grup üyelerinden bazılarının karakteri yok: ${missingUsers}\nHerkesin \`/rpg create\` ile karakter oluşturması gerekiyor!`,
                ephemeral: true
            });
        }
        await interaction.deferReply();
        // Calculate average level
        const totalLevel = memberCharacters.reduce((sum, m) => sum + (m.character?.level || 0), 0);
        const averageLevel = Math.floor(totalLevel / memberCharacters.length);
        // Generate raid bosses
        const { RaidService } = await Promise.resolve().then(() => __importStar(require('../services/raidService')));
        const bosses = RaidService.generateRaidBosses(averageLevel);
        // Calculate turn order based on speed
        const participantStats = memberCharacters.map(m => ({
            userId: m.userId,
            speed: rpgService_1.rpgService.calculateDerivedStats(m.character).speed
        }));
        const turnOrder = RaidService.calculateTurnOrder(participantStats);
        // Initialize participant states
        const participantStates = {};
        for (const member of memberCharacters) {
            const stats = rpgService_1.rpgService.calculateDerivedStats(member.character);
            participantStates[member.userId] = {
                isDefending: false,
                hp: member.character.currentHp,
                mana: member.character.currentMana
            };
        }
        // Create raid combat state
        const raidId = `raid_${Date.now()}`;
        const raidCombat = {
            id: raidId,
            groupId: group.id,
            participants: group.members,
            currentBossIndex: 0,
            bosses: bosses,
            currentTurnUserId: turnOrder[0],
            turnOrder: turnOrder,
            turnCount: 0,
            participantStates: participantStates,
            combatLog: [],
            messageId: '',
            startedAt: Date.now(),
            status: 'active'
        };
        // Create raid embed
        const firstBoss = bosses[0];
        const { EnemyGenerator } = await Promise.resolve().then(() => __importStar(require('../services/enemyService')));
        const { CombatService } = await Promise.resolve().then(() => __importStar(require('../services/combatService')));
        const { BossTraitHandler } = await Promise.resolve().then(() => __importStar(require('../services/bossTraitHandler')));
        const enemyEmoji = EnemyGenerator.getEnemyEmoji(firstBoss.name);
        const enemyHpBar = CombatService.createHPBar(firstBoss.hp, firstBoss.maxHp, 15);
        const traitInfo = BossTraitHandler.getTraitInfo(firstBoss);
        const participantList = group.members.map((userId, index) => {
            const isTurn = userId === turnOrder[0];
            return `${isTurn ? '▶️' : '⏸️'} <@${userId}>`;
        }).join('\n');
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(`${enemyEmoji} RAID STARTED - Boss 1/3`)
            .setDescription(`**${firstBoss.name}**\n\n` +
            '```\n' +
            `${enemyEmoji} ${firstBoss.name}\n` +
            `❤️ HP: ${enemyHpBar} ${firstBoss.hp}/${firstBoss.maxHp}\n` +
            `⚔️ ATK: ${firstBoss.attack} | 🛡️ DEF: ${firstBoss.defense}\n` +
            '```\n\n' +
            (traitInfo ? `**🌟 Boss Trait:**\n${traitInfo}\n\n` : '') +
            '**👥 Party:**\n' +
            participantList)
            .addFields({ name: '📜 Combat Log', value: '> Raid combat started! Work together to defeat 3 bosses!', inline: false }, { name: '🎯 Current Turn', value: `<@${turnOrder[0]}> - Choose your action!`, inline: false })
            .setFooter({ text: 'Turn-based combat | Only the current player can act!' })
            .setTimestamp();
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`raid_attack_${raidId}`)
            .setLabel('⚔️ Attack')
            .setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder()
            .setCustomId(`raid_defend_${raidId}`)
            .setLabel('🛡️ Defend')
            .setStyle(discord_js_1.ButtonStyle.Primary));
        const reply = await interaction.editReply({ embeds: [embed], components: [row] });
        raidCombat.messageId = reply.id;
        const { db } = require('../services/firebase');
        const { doc, setDoc } = require('firebase/firestore');
        await setDoc(doc(db, 'activeRaids', raidId), raidCombat);
    },
    async handleInventory(interaction) {
        const targetUser = interaction.options.getUser('kullanici') || interaction.user;
        const character = await rpgService_1.rpgService.getCharacter(targetUser.id);
        if (!character) {
            return interaction.reply({
                content: targetUser.id === interaction.user.id
                    ? '❌ Henüz bir karakterin yok! `/rpg create` ile oluşturabilirsin.'
                    : `❌ ${targetUser.username} henüz bir karakter oluşturmamış!`,
                ephemeral: true
            });
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle(`🎒 ${targetUser.username} - RPG Envanter`)
            .setThumbnail(targetUser.displayAvatarURL())
            .setTimestamp();
        // Equipped items
        const equippedList = [];
        if (character.equipment.weapon)
            equippedList.push(`⚔️ Weapon: ${character.equipment.weapon}`);
        if (character.equipment.armor)
            equippedList.push(`🛡️ Armor: ${character.equipment.armor}`);
        if (character.equipment.accessory)
            equippedList.push(`💍 Accessory: ${character.equipment.accessory}`);
        if (equippedList.length > 0) {
            embed.addFields({
                name: '⚡ Equipped',
                value: equippedList.join('\n'),
                inline: false
            });
        }
        // Inventory items
        if (character.inventory.length > 0) {
            // Group by itemId
            const itemCounts = new Map();
            character.inventory.forEach(item => {
                if (!item.equipped) {
                    itemCounts.set(item.itemId, (itemCounts.get(item.itemId) || 0) + item.amount);
                }
            });
            if (itemCounts.size > 0) {
                const itemList = Array.from(itemCounts.entries())
                    .map(([itemId, count]) => `📦 ${itemId} x${count}`)
                    .join('\n');
                embed.addFields({
                    name: '🎒 Inventory',
                    value: itemList,
                    inline: false
                });
            }
            else {
                embed.addFields({
                    name: '🎒 Inventory',
                    value: 'Boş',
                    inline: false
                });
            }
        }
        else {
            embed.addFields({
                name: '🎒 Inventory',
                value: 'Boş',
                inline: false
            });
        }
        embed.addFields({ name: '💰 RPG Coin', value: `${character.rpgCoin} 🪙`, inline: true }, { name: '📊 Capacity', value: `${character.inventory.length}/${character.maxInventorySize}`, inline: true });
        await interaction.reply({ embeds: [embed] });
    },
    async handleEquip(interaction) {
        const itemId = interaction.options.getString('item', true);
        const character = await rpgService_1.rpgService.getCharacter(interaction.user.id);
        if (!character) {
            return interaction.reply({
                content: '❌ Önce `/rpg create` ile karakter oluşturmalısın!',
                ephemeral: true
            });
        }
        const { EquipmentService } = await Promise.resolve().then(() => __importStar(require('../services/equipmentService')));
        const result = await EquipmentService.equipItem(character, itemId);
        await interaction.reply({
            content: result.message,
            ephemeral: true
        });
    },
    async handleUnequip(interaction) {
        const slot = interaction.options.getString('slot', true);
        const character = await rpgService_1.rpgService.getCharacter(interaction.user.id);
        if (!character) {
            return interaction.reply({
                content: '❌ Önce `/rpg create` ile karakter oluşturmalısın!',
                ephemeral: true
            });
        }
        const { EquipmentService } = await Promise.resolve().then(() => __importStar(require('../services/equipmentService')));
        const result = await EquipmentService.unequipItem(character, slot);
        await interaction.reply({
            content: result.message,
            ephemeral: true
        });
    },
    async handleUse(interaction) {
        const itemId = interaction.options.getString('item', true);
        const character = await rpgService_1.rpgService.getCharacter(interaction.user.id);
        if (!character) {
            return interaction.reply({
                content: '❌ Önce `/rpg create` ile karakter oluşturmalısın!',
                ephemeral: true
            });
        }
        const { ItemService } = await Promise.resolve().then(() => __importStar(require('../services/itemService')));
        const result = await ItemService.useItem(character, itemId);
        await interaction.reply({
            content: result.message,
            ephemeral: true
        });
    },
    async handleSkills(interaction) {
        const character = await rpgService_1.rpgService.getCharacter(interaction.user.id);
        if (!character) {
            return interaction.reply({
                content: '❌ Henüz bir karakterin yok! `/rpg create` ile oluşturabilirsin.',
                ephemeral: true
            });
        }
        const { getAvailableSkills } = await Promise.resolve().then(() => __importStar(require('../data/skills')));
        const availableSkills = getAvailableSkills(character.class, character.level);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x9b59b6)
            .setTitle(`✨ ${character.name} - Skills`)
            .setDescription(`**Class:** ${character.class}\n**Level:** ${character.level}`)
            .setTimestamp();
        if (availableSkills.length === 0) {
            embed.addFields({
                name: '🚫 No Skills',
                value: 'Level 3e ulaşınca ilk skillini açacaksın!',
                inline: false
            });
        }
        else {
            const skillList = availableSkills.map(skill => `**${skill.name}** (Lv.${skill.levelRequired})\n` +
                `> ${skill.description}\n` +
                `> 💧 Mana: ${skill.manaCost} | ⏱️ Cooldown: ${skill.cooldown} turn`).join('\n\n');
            embed.addFields({
                name: '📜 Available Skills',
                value: skillList,
                inline: false
            });
        }
        await interaction.reply({ embeds: [embed] });
    },
    async handleRest(interaction) {
        const character = await rpgService_1.rpgService.getCharacter(interaction.user.id);
        if (!character) {
            return interaction.reply({
                content: '❌ Önce `/rpg create` ile karakter oluşturmalısın!',
                ephemeral: true
            });
        }
        // Check cooldown (1 saat)
        if (character.lastRest) {
            const timeSinceLastRest = Date.now() - character.lastRest.getTime();
            const cooldown = 60 * 60 * 1000; // 1 saat
            if (timeSinceLastRest < cooldown) {
                const remainingTime = Math.ceil((cooldown - timeSinceLastRest) / 1000);
                const minutes = Math.floor(remainingTime / 60);
                const seconds = remainingTime % 60;
                return interaction.reply({
                    content: `⏰ Henüz dinlenemezsin! **${minutes}:${seconds.toString().padStart(2, '0')}** sonra tekrar dinlenebilirsin.`,
                    ephemeral: true
                });
            }
        }
        const derivedStats = rpgService_1.rpgService.calculateDerivedStats(character);
        // Calculate 50% restore
        const hpRestore = Math.floor(derivedStats.maxHp * 0.50);
        const manaRestore = Math.floor(derivedStats.maxMana * 0.50);
        const hpBefore = character.currentHp;
        const manaBefore = character.currentMana;
        character.currentHp = Math.min(character.currentHp + hpRestore, derivedStats.maxHp);
        character.currentMana = Math.min(character.currentMana + manaRestore, derivedStats.maxMana);
        character.lastRest = new Date();
        const actualHpRestored = character.currentHp - hpBefore;
        const actualManaRestored = character.currentMana - manaBefore;
        await rpgService_1.rpgService.updateCharacter(character);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle('🛏️ Dinlendin!')
            .setDescription(`**${character.name}** biraz dinlendi ve enerjisini toparladı.\n\n` +
            `❤️ **HP:** +${actualHpRestored} (${character.currentHp}/${derivedStats.maxHp})\n` +
            `💙 **Mana:** +${actualManaRestored} (${character.currentMana}/${derivedStats.maxMana})\n\n` +
            `*1 saat sonra tekrar dinlenebilirsin.*`)
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    },
    async handleFull(interaction) {
        // Admin check
        if (!interaction.memberPermissions?.has('Administrator')) {
            return interaction.reply({
                content: '❌ Bu komut sadece adminler için!',
                ephemeral: true
            });
        }
        const targetUser = interaction.options.getUser('kullanici') || interaction.user;
        const character = await rpgService_1.rpgService.getCharacter(targetUser.id);
        if (!character) {
            return interaction.reply({
                content: targetUser.id === interaction.user.id
                    ? '❌ Önce `/rpg create` ile karakter oluşturmalısın!'
                    : `❌ ${targetUser.username} henüz bir karakter oluşturmamış!`,
                ephemeral: true
            });
        }
        const derivedStats = rpgService_1.rpgService.calculateDerivedStats(character);
        const hpBefore = character.currentHp;
        const manaBefore = character.currentMana;
        character.currentHp = derivedStats.maxHp;
        character.currentMana = derivedStats.maxMana;
        const hpRestored = character.currentHp - hpBefore;
        const manaRestored = character.currentMana - manaBefore;
        await rpgService_1.rpgService.updateCharacter(character);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0xf39c12)
            .setTitle('✨ [ADMIN] Full Restore')
            .setDescription(`**${character.name}** tam can ve mana ile dolduruldu!\n\n` +
            `❤️ **HP:** +${hpRestored} (${character.currentHp}/${derivedStats.maxHp})\n` +
            `💙 **Mana:** +${manaRestored} (${character.currentMana}/${derivedStats.maxMana})\n\n` +
            `*Admin komutu kullanıldı*`)
            .setThumbnail(targetUser.displayAvatarURL())
            .setFooter({ text: `Admin: ${interaction.user.username}` })
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    }
};
