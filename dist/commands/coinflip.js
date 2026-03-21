"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const databaseService_1 = require("../services/databaseService");
const questService_1 = require("../services/questService");
const messageCleanup_1 = require("../utils/messageCleanup");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('coinflip')
        .setDescription('Yazı tura oyna ve coin kazan!')
        .addIntegerOption(option => option.setName('miktar')
        .setDescription('Bahis miktarı')
        .setRequired(true)
        .setMinValue(10))
        .addStringOption(option => option.setName('tahmin')
        .setDescription('Tahminin (opsiyonel)')
        .addChoices({ name: '🪙 Yazı', value: 'heads' }, { name: '🪙 Tura', value: 'tails' }))
        .addUserOption(option => option.setName('rakip')
        .setDescription('PvP için rakip (opsiyonel)')),
    async execute(interaction) {
        const amount = interaction.options.getInteger('miktar', true);
        const guess = interaction.options.getString('tahmin');
        const opponent = interaction.options.getUser('rakip');
        const player = await databaseService_1.databaseService.getPlayer(interaction.user.id);
        if (!player) {
            return interaction.reply({
                content: '❌ Önce `/kayit` komutu ile kayıt olmalısınız!',
                ephemeral: true
            });
        }
        if (player.balance < amount) {
            return interaction.reply({
                content: `❌ Yetersiz bakiye! Mevcut: ${player.balance} 🪙`,
                ephemeral: true
            });
        }
        // Bahsi çıkar
        player.balance -= amount;
        await databaseService_1.databaseService.updatePlayer(player);
        // Quest tracking - Coinflip play ve casino spent
        await questService_1.questService.trackCoinflipPlay(interaction.user.id);
        await questService_1.questService.trackCasinoSpent(interaction.user.id, amount);
        // PvP Mode
        if (opponent) {
            if (opponent.id === interaction.user.id) {
                return interaction.reply({
                    content: '❌ Kendinizle oynayamazsınız!',
                    ephemeral: true
                });
            }
            if (opponent.bot) {
                return interaction.reply({
                    content: '❌ Botlarla oynayamazsınız!',
                    ephemeral: true
                });
            }
            const opponentPlayer = await databaseService_1.databaseService.getPlayer(opponent.id);
            if (!opponentPlayer) {
                // Bahsi geri ver
                player.balance += amount;
                await databaseService_1.databaseService.updatePlayer(player);
                return interaction.reply({
                    content: `❌ ${opponent.username} henüz kayıt olmamış!`,
                    ephemeral: true
                });
            }
            if (opponentPlayer.balance < amount) {
                // Bahsi geri ver
                player.balance += amount;
                await databaseService_1.databaseService.updatePlayer(player);
                return interaction.reply({
                    content: `❌ ${opponent.username} kullanıcısının bakiyesi yetersiz!`,
                    ephemeral: true
                });
            }
            // Rakibin bahsini çıkar
            opponentPlayer.balance -= amount;
            await databaseService_1.databaseService.updatePlayer(opponentPlayer);
            // Quest tracking for opponent
            await questService_1.questService.trackCoinflipPlay(opponent.id);
            await questService_1.questService.trackCasinoSpent(opponent.id, amount);
            // PvP Coinflip
            const result = Math.random() < 0.5 ? 'heads' : 'tails';
            const resultText = result === 'heads' ? '🪙 Yazı' : '🪙 Tura';
            const winner = Math.random() < 0.5 ? interaction.user : opponent;
            const loser = winner.id === interaction.user.id ? opponent : interaction.user;
            const winnerPlayer = winner.id === interaction.user.id ? player : opponentPlayer;
            const loserPlayer = winner.id === interaction.user.id ? opponentPlayer : player;
            // Kazanana 2x bahis ver (kendi bahsi + rakibin bahsi)
            winnerPlayer.balance += amount * 2;
            await databaseService_1.databaseService.updatePlayer(winnerPlayer);
            await databaseService_1.databaseService.updatePlayer(loserPlayer);
            // Quest tracking - Casino win
            await questService_1.questService.trackCasinoWin(winner.id, amount, true);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0xffd700)
                .setTitle('🪙 PvP Coinflip')
                .setDescription(`**Sonuç:** ${resultText}`)
                .addFields({ name: '🏆 Kazanan', value: `<@${winner.id}>`, inline: true }, { name: '💸 Kaybeden', value: `<@${loser.id}>`, inline: true }, { name: '💰 Miktar', value: `${amount} 🪙`, inline: true })
                .setTimestamp();
            return interaction.reply({ embeds: [embed] }).then(msg => (0, messageCleanup_1.autoDeleteMessage)(msg));
        }
        // Solo Mode - Ev avantajı %60 (Önceki: %52)
        let playerGuess;
        if (!guess) {
            // Tahmin yoksa butonlarla sor
            const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId(`coinflip_heads_${amount}`)
                .setLabel('🪙 Yazı')
                .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
                .setCustomId(`coinflip_tails_${amount}`)
                .setLabel('🪙 Tura')
                .setStyle(discord_js_1.ButtonStyle.Primary));
            return interaction.reply({
                content: `🪙 **${amount} 🪙** bahis ile Coinflip!\n\nTahmininizi seçin:`,
                components: [buttons],
                ephemeral: true
            });
        }
        playerGuess = guess;
        // Ev avantajı: %60 bot kazanır (Önceki: %52)
        const houseWins = Math.random() < 0.60;
        let result;
        if (houseWins) {
            // Bot kazanır - oyuncunun tahmininin tersi
            result = playerGuess === 'heads' ? 'tails' : 'heads';
        }
        else {
            // Oyuncu kazanır
            result = playerGuess;
        }
        const resultText = result === 'heads' ? '🪙 Yazı' : '🪙 Tura';
        const won = result === playerGuess;
        if (won) {
            // Kazanç ver: 2x bahis (kendi bahsi + kazanç)
            player.balance += amount * 2;
            await databaseService_1.databaseService.updatePlayer(player);
            // Quest tracking - Casino win
            await questService_1.questService.trackCasinoWin(interaction.user.id, amount, true);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('🎉 Coinflip - Kazandın!')
                .setDescription(`**Sonuç:** ${resultText}`)
                .addFields({ name: '💰 Kazanç', value: `+${amount} 🪙`, inline: true }, { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: true })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] }).then(msg => (0, messageCleanup_1.autoDeleteMessage)(msg));
        }
        else {
            // Kaybetti (bahis zaten çıkarıldı)
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('💸 Coinflip - Kaybettin!')
                .setDescription(`**Sonuç:** ${resultText}`)
                .addFields({ name: '💸 Kayıp', value: `-${amount} 🪙`, inline: true }, { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: true })
                .setTimestamp();
            await interaction.reply({ embeds: [embed] }).then(msg => (0, messageCleanup_1.autoDeleteMessage)(msg));
        }
    },
};
