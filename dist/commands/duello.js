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
const duelService_1 = require("../services/duelService");
const databaseService_1 = require("../services/databaseService");
const logger_1 = require("../utils/logger");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('duello')
        .setDescription('Düello sistemi')
        .addSubcommand(sub => sub.setName('challenge')
        .setDescription('Düello daveti gönder')
        .addUserOption(opt => opt.setName('rakip').setDescription('Düello yapılacak rakip').setRequired(true))
        .addIntegerOption(opt => opt.setName('miktar').setDescription('Düello miktarı (bakiye)').setRequired(true).setMinValue(1)))
        .addSubcommand(sub => sub.setName('sonuc')
        .setDescription('Düello sonucunu gir')
        .addStringOption(opt => opt.setName('duello_id').setDescription('Düello ID').setRequired(true))
        .addUserOption(opt => opt.setName('kazanan').setDescription('Kazanan oyuncu').setRequired(true))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'challenge') {
            const opponent = interaction.options.getUser('rakip', true);
            const amount = interaction.options.getInteger('miktar', true);
            if (opponent.id === interaction.user.id) {
                return interaction.reply({
                    content: '❌ Kendinizle düello yapamazsınız!',
                    ephemeral: true
                });
            }
            if (opponent.bot) {
                return interaction.reply({
                    content: '❌ Botlarla düello yapamazsınız!',
                    ephemeral: true
                });
            }
            // Challenger bakiye kontrolü
            const challengerPlayer = await databaseService_1.databaseService.getPlayer(interaction.user.id);
            if (!challengerPlayer) {
                return interaction.reply({
                    content: '❌ Önce `/kayit` komutu ile kayıt olmalısınız!',
                    ephemeral: true
                });
            }
            if (challengerPlayer.balance < amount) {
                return interaction.reply({
                    content: `❌ Bakiyeniz yetersiz! Gerekli: ${amount} 🪙, Mevcut: ${challengerPlayer.balance} 🪙`,
                    ephemeral: true
                });
            }
            // Opponent bakiye kontrolü
            const opponentPlayer = await databaseService_1.databaseService.getPlayer(opponent.id);
            if (!opponentPlayer) {
                return interaction.reply({
                    content: `❌ ${opponent.username} henüz kayıt olmamış!`,
                    ephemeral: true
                });
            }
            if (opponentPlayer.balance < amount) {
                return interaction.reply({
                    content: `❌ ${opponent.username} kullanıcısının bakiyesi yetersiz! (${opponentPlayer.balance} 🪙)`,
                    ephemeral: true
                });
            }
            // Aktif düello kontrolü
            const activeDuels = await duelService_1.duelService.getUserActiveDuels(interaction.user.id);
            if (activeDuels.length > 0) {
                return interaction.reply({
                    content: '❌ Zaten aktif bir düellonuz var!',
                    ephemeral: true
                });
            }
            const opponentActiveDuels = await duelService_1.duelService.getUserActiveDuels(opponent.id);
            if (opponentActiveDuels.length > 0) {
                return interaction.reply({
                    content: `❌ ${opponent.username} zaten aktif bir düelloda!`,
                    ephemeral: true
                });
            }
            try {
                const { duelService } = await Promise.resolve().then(() => __importStar(require('../services/duelService')));
                const { botStatusService } = await Promise.resolve().then(() => __importStar(require('../services/botStatusService')));
                if (botStatusService.isDevMode()) {
                    // Test modu - Düello daveti simülasyonu
                    await botStatusService.sendToDevChannel(interaction.client, interaction.guildId, `Düello daveti DM gönderildi: ${opponent.username} kullanıcısına ${amount} 🪙 miktarında`);
                    await interaction.reply({
                        content: `🧪 ${botStatusService.getTestMessage('Düello daveti DM gönderme')} Rakip: ${opponent.username}, Miktar: ${amount} 🪙`,
                        ephemeral: true
                    });
                    return;
                }
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor(0xff6b6b)
                    .setTitle('⚔️ Düello Daveti!')
                    .setDescription(`<@${interaction.user.id}> sizi düelloya davet etti!`)
                    .addFields({ name: '💰 Bahis Miktarı', value: `${amount} 🪙`, inline: true }, { name: '🆔 Düello ID', value: `\`${duel.id}\``, inline: true })
                    .setFooter({ text: 'Düelloyu kabul ederseniz, kendi aranızda maç kurup oynayacaksınız.' })
                    .setTimestamp();
                const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                    .setCustomId(`duel_accept_${duel.id}`)
                    .setLabel('Kabul Et')
                    .setStyle(discord_js_1.ButtonStyle.Success)
                    .setEmoji('⚔️'), new discord_js_1.ButtonBuilder()
                    .setCustomId(`duel_decline_${duel.id}`)
                    .setLabel('Reddet')
                    .setStyle(discord_js_1.ButtonStyle.Danger)
                    .setEmoji('❌'));
                await opponent.send({ embeds: [embed], components: [buttons] });
                await interaction.reply({
                    content: `✅ ${opponent.username} kullanıcısına düello daveti gönderildi! (${amount} 🪙)`,
                    ephemeral: true
                });
            }
            catch (error) {
                await duelService_1.duelService.deleteDuel(duel.id);
                logger_1.Logger.error('Düello daveti gönderilemedi', error);
                await interaction.reply({
                    content: '❌ Kullanıcıya DM gönderilemedi! DM\'leri kapalı olabilir.',
                    ephemeral: true
                });
            }
        }
        else if (subcommand === 'sonuc') {
            const duelId = interaction.options.getString('duello_id', true);
            const winner = interaction.options.getUser('kazanan', true);
            const duel = await duelService_1.duelService.getDuel(duelId);
            if (!duel) {
                return interaction.reply({
                    content: '❌ Düello bulunamadı!',
                    ephemeral: true
                });
            }
            if (duel.status !== 'accepted') {
                return interaction.reply({
                    content: '❌ Bu düello henüz kabul edilmemiş veya zaten tamamlanmış!',
                    ephemeral: true
                });
            }
            // Sadece düelloya katılanlar sonuç girebilir
            if (interaction.user.id !== duel.challenger && interaction.user.id !== duel.challenged) {
                return interaction.reply({
                    content: '❌ Bu düellonun sonucunu girme yetkiniz yok!',
                    ephemeral: true
                });
            }
            // Kazanan düelloya katılan biri olmalı
            if (winner.id !== duel.challenger && winner.id !== duel.challenged) {
                return interaction.reply({
                    content: '❌ Kazanan düelloya katılan birisi olmalı!',
                    ephemeral: true
                });
            }
            // Düelloyu tamamla
            await duelService_1.duelService.completeDuel(duelId, winner.id);
            // Bakiye transferi
            const winnerId = winner.id;
            const loserId = winnerId === duel.challenger ? duel.challenged : duel.challenger;
            const winnerPlayer = await databaseService_1.databaseService.getPlayer(winnerId);
            const loserPlayer = await databaseService_1.databaseService.getPlayer(loserId);
            if (winnerPlayer && loserPlayer) {
                winnerPlayer.balance += duel.amount;
                loserPlayer.balance -= duel.amount;
                await databaseService_1.databaseService.updatePlayer(winnerPlayer);
                await databaseService_1.databaseService.updatePlayer(loserPlayer);
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor(0x00ff00)
                    .setTitle('⚔️ Düello Tamamlandı!')
                    .setDescription(`**Kazanan:** <@${winnerId}>`)
                    .addFields({ name: '💰 Transfer Edilen Miktar', value: `${duel.amount} 🪙`, inline: true }, { name: '🆔 Düello ID', value: `\`${duelId}\``, inline: true })
                    .setTimestamp();
                await interaction.reply({ embeds: [embed] });
                logger_1.Logger.success('Düello tamamlandı ve bakiye transfer edildi', { duelId, winnerId, amount: duel.amount });
            }
            else {
                await interaction.reply({
                    content: '❌ Oyuncu verileri güncellenirken hata oluştu!',
                    ephemeral: true
                });
            }
        }
    },
};
