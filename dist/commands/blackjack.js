"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const databaseService_1 = require("../services/databaseService");
const questService_1 = require("../services/questService");
const firebase_1 = require("../services/firebase");
const firestore_1 = require("firebase/firestore");
const messageCleanup_1 = require("../utils/messageCleanup");
const CARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS = ['♠️', '♥️', '♦️', '♣️'];
function drawCard() {
    const card = CARDS[Math.floor(Math.random() * CARDS.length)];
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    return `${card}${suit}`;
}
function calculateValue(hand) {
    let value = 0;
    let aces = 0;
    for (const card of hand) {
        const rank = card.slice(0, -2);
        if (rank === 'A') {
            aces++;
            value += 11;
        }
        else if (['J', 'Q', 'K'].includes(rank)) {
            value += 10;
        }
        else {
            value += parseInt(rank);
        }
    }
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }
    return value;
}
function formatHand(hand, hideFirst = false) {
    if (hideFirst) {
        return `🂠 ${hand.slice(1).join(' ')}`;
    }
    return hand.join(' ');
}
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Blackjack oyna!')
        .addIntegerOption(option => option.setName('miktar')
        .setDescription('Bahis miktarı')
        .setRequired(true)
        .setMinValue(10)),
    async execute(interaction) {
        const amount = interaction.options.getInteger('miktar', true);
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
        // Quest tracking - Blackjack play ve casino spent
        await questService_1.questService.trackBlackjackPlay(interaction.user.id);
        await questService_1.questService.trackCasinoSpent(interaction.user.id, amount);
        // Oyun başlat
        const playerHand = [drawCard(), drawCard()];
        const dealerHand = [drawCard(), drawCard()];
        const playerValue = calculateValue(playerHand);
        const dealerValue = calculateValue(dealerHand);
        const game = {
            userId: interaction.user.id,
            bet: amount,
            playerHand,
            dealerHand,
            playerValue,
            dealerValue,
            doubled: false
        };
        await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'blackjackGames', interaction.user.id), game);
        // Blackjack kontrolü
        if (playerValue === 21) {
            await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'blackjackGames', interaction.user.id));
            // Blackjack: 2.5x ödeme (bahis + 1.5x kazanç)
            const winAmount = Math.floor(amount * 2.5);
            player.balance += winAmount;
            await databaseService_1.databaseService.updatePlayer(player);
            // Quest tracking - Blackjack WIN ve Casino win
            await questService_1.questService.trackBlackjackPlay(interaction.user.id, true);
            const netWin = winAmount - amount;
            await questService_1.questService.trackCasinoWin(interaction.user.id, netWin, true);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0xffd700)
                .setTitle('🎉 BLACKJACK!')
                .addFields({ name: '🎴 Senin Elin', value: `${formatHand(playerHand)}\n**Değer: ${playerValue}**`, inline: true }, { name: '🎴 Krupiye', value: `${formatHand(dealerHand)}\n**Değer: ${dealerValue}**`, inline: true }, { name: '💰 Kazanç', value: `+${winAmount - amount} 🪙 (1.5x)`, inline: false }, { name: '💳 Yeni Bakiye', value: `${player.balance} 🪙`, inline: false })
                .setTimestamp();
            return interaction.reply({ embeds: [embed] }).then(msg => (0, messageCleanup_1.autoDeleteMessage)(msg));
        }
        const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('blackjack_hit')
            .setLabel('Hit')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setEmoji('🎴'), new discord_js_1.ButtonBuilder()
            .setCustomId('blackjack_stand')
            .setLabel('Stand')
            .setStyle(discord_js_1.ButtonStyle.Success)
            .setEmoji('✋'), new discord_js_1.ButtonBuilder()
            .setCustomId('blackjack_double')
            .setLabel('Double')
            .setStyle(discord_js_1.ButtonStyle.Danger)
            .setEmoji('💰')
            .setDisabled(player.balance < amount * 2));
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle('🎴 Blackjack')
            .addFields({ name: '🎴 Senin Elin', value: `${formatHand(playerHand)}\n**Değer: ${playerValue}**`, inline: true }, { name: '🎴 Krupiye', value: `${formatHand(dealerHand, true)}\n**Değer: ?**`, inline: true }, { name: '💰 Bahis', value: `${amount} 🪙`, inline: false })
            .setFooter({ text: 'Hit: Kart çek | Stand: Dur | Double: Bahsi ikiye katla' })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], components: [buttons] });
    },
};
