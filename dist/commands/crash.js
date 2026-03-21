"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const databaseService_1 = require("../services/databaseService");
const questService_1 = require("../services/questService");
const firebase_1 = require("../services/firebase");
const firestore_1 = require("firebase/firestore");
const logger_1 = require("../utils/logger");
// Ev avantajı için crash point hesaplama
// Average crash: ~1.45x, Median crash: ~1.30x
function generateCrashPoint() {
    const r = Math.random();
    if (r < 0.50) {
        return random(1.00, 1.15);
    }
    else if (r < 0.75) {
        return random(1.15, 1.40);
    }
    else if (r < 0.88) {
        return random(1.40, 1.80);
    }
    else if (r < 0.95) {
        return random(1.80, 2.50);
    }
    else if (r < 0.98) {
        return random(2.50, 4.00);
    }
    else if (r < 0.995) {
        return random(4.00, 7.00);
    }
    else {
        return random(7.00, 15.00);
    }
}
function random(min, max) {
    return Math.random() * (max - min) + min;
}
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('crash')
        .setDescription('Crash oyunu oyna!')
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
        // Aktif oyun kontrolü
        const existingGame = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'crashGames', interaction.user.id));
        if (existingGame.exists()) {
            return interaction.reply({
                content: '❌ Zaten aktif bir Crash oyununuz var!',
                ephemeral: true
            });
        }
        // Crash point'i önceden belirle
        const crashPoint = generateCrashPoint();
        // Bahsi hemen çıkar
        player.balance -= amount;
        await databaseService_1.databaseService.updatePlayer(player);
        // Quest tracking - Casino spent
        await questService_1.questService.trackCasinoSpent(interaction.user.id, amount);
        const game = {
            userId: interaction.user.id,
            bet: amount,
            crashPoint,
            startTime: Date.now(),
            crashed: false
        };
        await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'crashGames', interaction.user.id), game);
        const cashoutButton = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId('crash_cashout')
            .setLabel('💰 Cashout')
            .setStyle(discord_js_1.ButtonStyle.Success));
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(0x3498db)
            .setTitle('🚀 Crash Oyunu Başladı!')
            .setDescription('Multiplier artıyor... Crash olmadan önce cashout yap!')
            .addFields({ name: '💰 Bahis', value: `${amount} 🪙`, inline: true }, { name: '📊 Mevcut Çarpan', value: '1.00x', inline: true }, { name: '💵 Potansiyel Kazanç', value: `${amount} 🪙`, inline: true })
            .setFooter({ text: 'Cashout butonuna basarak kazancını al!' })
            .setTimestamp();
        const reply = await interaction.reply({ embeds: [embed], components: [cashoutButton], fetchReply: true });
        game.messageId = reply.id;
        await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'crashGames', interaction.user.id), game);
        // Crash simulasyonu başla
        let currentMultiplier = 1.0;
        const updateInterval = 100; // 100ms'de bir güncelle (daha smooth)
        const incrementPerUpdate = 0.01; // Her 100ms'de 0.01 artır
        const crashInterval = setInterval(async () => {
            try {
                const gameDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'crashGames', interaction.user.id));
                if (!gameDoc.exists()) {
                    clearInterval(crashInterval);
                    return;
                }
                const gameData = gameDoc.data();
                // Eğer zaten crashed ise interval'i durdur
                if (gameData.crashed) {
                    clearInterval(crashInterval);
                    return;
                }
                currentMultiplier += incrementPerUpdate;
                // Crash oldu mu kontrol et
                if (currentMultiplier >= gameData.crashPoint) {
                    currentMultiplier = gameData.crashPoint;
                    // Oyunu crashed olarak işaretle
                    await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'crashGames', interaction.user.id), {
                        ...gameData,
                        crashed: true
                    });
                    clearInterval(crashInterval);
                    // Crash mesajını gönder
                    const crashEmbed = new discord_js_1.EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle(`💥 ${gameData.crashPoint.toFixed(2)}x'de CRASH OLDU!`)
                        .setDescription('😢 Maalesef kaybettiniz!')
                        .addFields({ name: '💰 Bahis', value: `${gameData.bet} 🪙`, inline: true }, { name: '📊 Crash Noktası', value: `${gameData.crashPoint.toFixed(2)}x`, inline: true }, { name: '💸 Kayıp', value: `-${gameData.bet} 🪙`, inline: true })
                        .setTimestamp();
                    try {
                        await interaction.editReply({ embeds: [crashEmbed], components: [] });
                    }
                    catch (error) {
                        logger_1.Logger.error('Crash mesajı güncellenemedi', error);
                    }
                    // Oyunu sil
                    await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'crashGames', interaction.user.id));
                    return;
                }
                // Her 500ms'de bir mesajı güncelle (Discord rate limit'i için)
                if (Math.floor(currentMultiplier * 100) % 5 === 0) {
                    const potentialWin = Math.floor(amount * currentMultiplier);
                    const updatedEmbed = new discord_js_1.EmbedBuilder()
                        .setColor(0x3498db)
                        .setTitle('🚀 Crash Oyunu Devam Ediyor!')
                        .setDescription('Multiplier artıyor... Crash olmadan önce cashout yap!')
                        .addFields({ name: '💰 Bahis', value: `${amount} 🪙`, inline: true }, { name: '📊 Mevcut Çarpan', value: `${currentMultiplier.toFixed(2)}x`, inline: true }, { name: '💵 Potansiyel Kazanç', value: `${potentialWin} 🪙`, inline: true })
                        .setFooter({ text: 'Cashout butonuna basarak kazancını al!' })
                        .setTimestamp();
                    try {
                        await interaction.editReply({ embeds: [updatedEmbed], components: [cashoutButton] });
                    }
                    catch (error) {
                        logger_1.Logger.error('Embed güncellenemedi', error);
                    }
                }
            }
            catch (error) {
                logger_1.Logger.error('Crash interval hatası', error);
                clearInterval(crashInterval);
            }
        }, updateInterval);
        // 60 saniye sonra otomatik olarak oyunu sonlandır
        setTimeout(async () => {
            clearInterval(crashInterval);
            const gameDoc = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'crashGames', interaction.user.id));
            if (gameDoc.exists() && !gameDoc.data().crashed) {
                await (0, firestore_1.setDoc)((0, firestore_1.doc)(firebase_1.db, 'crashGames', interaction.user.id), {
                    ...gameDoc.data(),
                    crashed: true
                });
                try {
                    await interaction.deleteReply();
                }
                catch (error) {
                    logger_1.Logger.error('Crash mesajı silinemedi', error);
                }
                await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'crashGames', interaction.user.id));
            }
        }, 60000);
    },
};
