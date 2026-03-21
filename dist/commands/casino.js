"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const firebase_1 = require("../services/firebase");
const firestore_1 = require("firebase/firestore");
const databaseService_1 = require("../services/databaseService");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('casino')
        .setDescription('Casino oyun yönetimi')
        .addSubcommand(subcommand => subcommand
        .setName('iptal')
        .setDescription('Tüm aktif casino oyunlarınızı iptal edin')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'iptal') {
            const player = await databaseService_1.databaseService.getPlayer(interaction.user.id);
            if (!player) {
                return interaction.reply({
                    content: '❌ Önce `/kayit` komutu ile kayıt olmalısınız!',
                    ephemeral: true
                });
            }
            let cancelledGames = [];
            // Crash oyunu kontrolü
            const crashGame = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'crashGames', interaction.user.id));
            if (crashGame.exists()) {
                const gameData = crashGame.data();
                // Bahsi geri verme (kaybedildiği için geri verme yok, zaten çıkarılmış)
                // Sadece oyunu sil
                await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'crashGames', interaction.user.id));
                cancelledGames.push(`🚀 Crash`);
            }
            // Mines oyunu kontrolü
            const minesGame = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'minesGames', interaction.user.id));
            if (minesGame.exists()) {
                const gameData = minesGame.data();
                // Bahsi geri verme (kaybedildiği için geri verme yok, zaten çıkarılmış)
                // Sadece oyunu sil
                await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'minesGames', interaction.user.id));
                cancelledGames.push(`💣 Mines`);
            }
            // Blackjack oyunu kontrolü
            const blackjackGame = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'blackjackGames', interaction.user.id));
            if (blackjackGame.exists()) {
                const gameData = blackjackGame.data();
                // Bahsi geri verme (kaybedildiği için geri verme yok, zaten çıkarılmış)
                // Sadece oyunu sil
                await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'blackjackGames', interaction.user.id));
                cancelledGames.push(`🎴 Blackjack`);
            }
            // Slot oyunu kontrolü
            const slotGame = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'slotGames', interaction.user.id));
            if (slotGame.exists()) {
                const gameData = slotGame.data();
                // Bahsi geri verme (kaybedildiği için geri verme yok, zaten çıkarılmış)
                // Sadece oyunu sil
                await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'slotGames', interaction.user.id));
                cancelledGames.push(`🎰 Slot`);
            }
            // Coinflip oyunu kontrolü
            const coinflipGame = await (0, firestore_1.getDoc)((0, firestore_1.doc)(firebase_1.db, 'coinflipGames', interaction.user.id));
            if (coinflipGame.exists()) {
                const gameData = coinflipGame.data();
                // Bahsi geri verme (kaybedildiği için geri verme yok, zaten çıkarılmış)
                // Sadece oyunu sil
                await (0, firestore_1.deleteDoc)((0, firestore_1.doc)(firebase_1.db, 'coinflipGames', interaction.user.id));
                cancelledGames.push(`🪙 Coinflip`);
            }
            if (cancelledGames.length === 0) {
                return interaction.reply({
                    content: '❌ Aktif bir casino oyununuz bulunmuyor!',
                    ephemeral: true
                });
            }
            // Bakiyeyi güncelle
            await databaseService_1.databaseService.updatePlayer(player);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0xffa500)
                .setTitle('🎰 Casino Oyunları İptal Edildi')
                .setDescription('Tüm aktif oyunlarınız iptal edildi.')
                .addFields({ name: '🎮 İptal Edilen Oyunlar', value: cancelledGames.join('\n'), inline: false }, { name: '💳 Güncel Bakiye', value: `${player.balance} 🪙`, inline: false })
                .setTimestamp();
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
