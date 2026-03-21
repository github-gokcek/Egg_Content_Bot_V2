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
const groupService_1 = require("../services/groupService");
const logger_1 = require("../utils/logger");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('grup')
        .setDescription('Grup yönetimi')
        .addSubcommand(sub => sub.setName('olustur')
        .setDescription('Yeni grup oluştur')
        .addStringOption(opt => opt.setName('isim').setDescription('Grup ismi').setRequired(true)))
        .addSubcommand(sub => sub.setName('davet')
        .setDescription('Gruba oyuncu davet et')
        .addUserOption(opt => opt.setName('kullanici').setDescription('Davet edilecek kullanıcı').setRequired(true)))
        .addSubcommand(sub => sub.setName('cik')
        .setDescription('Gruptan ayrıl'))
        .addSubcommand(sub => sub.setName('bilgi')
        .setDescription('Grup bilgilerini göster')),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        if (subcommand === 'olustur') {
            const name = interaction.options.getString('isim', true);
            try {
                const group = await groupService_1.groupService.createGroup(interaction.user.id, name);
                await interaction.reply({
                    content: `✅ **${name}** grubu oluşturuldu!\n\`/grup davet\` komutu ile üye ekleyebilirsiniz.`,
                    ephemeral: true
                });
            }
            catch (error) {
                await interaction.reply({ content: `❌ ${error.message}`, ephemeral: true });
            }
        }
        else if (subcommand === 'davet') {
            const user = interaction.options.getUser('kullanici', true);
            const group = await groupService_1.groupService.getUserGroup(interaction.user.id);
            if (!group) {
                return interaction.reply({ content: '❌ Bir grupta değilsiniz!', ephemeral: true });
            }
            if (user.id === interaction.user.id) {
                return interaction.reply({ content: '❌ Kendinizi davet edemezsiniz!', ephemeral: true });
            }
            if (await groupService_1.groupService.isInGroup(user.id)) {
                return interaction.reply({ content: '❌ Bu kullanıcı zaten bir grupta!', ephemeral: true });
            }
            if (group.members.length >= 5) {
                return interaction.reply({ content: '❌ Grup dolu! (Max 5 kişi)', ephemeral: true });
            }
            try {
                const { inviteService } = await Promise.resolve().then(() => __importStar(require('../services/inviteService')));
                const { botStatusService } = await Promise.resolve().then(() => __importStar(require('../services/botStatusService')));
                if (botStatusService.isDevMode()) {
                    // Test modu - DM gönderme simülasyonu
                    await botStatusService.sendToDevChannel(interaction.client, interaction.guildId, `Grup daveti DM gönderildi: ${user.username} kullanıcısına **${group.name}** grubu için`);
                    await interaction.reply({
                        content: `🧪 ${botStatusService.getTestMessage('Grup daveti DM gönderme')} Kullanıcı: ${user.username}`,
                        ephemeral: true
                    });
                    return;
                }
                const inviteId = await inviteService.createInvite(group.id, user.id, interaction.user.id);
                // DM gönder
                const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder: DiscordEmbedBuilder } = await Promise.resolve().then(() => __importStar(require('discord.js')));
                const embed = new DiscordEmbedBuilder()
                    .setColor(0x3498db)
                    .setTitle('👥 Grup Daveti')
                    .setDescription(`<@${interaction.user.id}> sizi **${group.name}** grubuna davet etti!`)
                    .addFields({ name: 'Grup Üyeleri', value: group.members.map(m => `<@${m}>`).join(', ') }, { name: 'Üye Sayısı', value: `${group.members.length}/5` })
                    .setTimestamp();
                const buttons = new ActionRowBuilder().addComponents(new ButtonBuilder()
                    .setCustomId(`group_accept_${inviteId}`)
                    .setLabel('Kabul Et')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅'), new ButtonBuilder()
                    .setCustomId(`group_decline_${inviteId}`)
                    .setLabel('Reddet')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌'));
                await user.send({ embeds: [embed], components: [buttons] });
                await interaction.reply({
                    content: `✅ ${user.username} kullanıcısına davet gönderildi!`,
                    ephemeral: true
                });
                logger_1.Logger.success('Grup daveti gönderildi', { groupId: group.id, invitedUser: user.id });
            }
            catch (error) {
                logger_1.Logger.error('Davet gönderilemedi', error);
                await interaction.reply({ content: '❌ Kullanıcıya DM gönderilemedi! DM\'leri kapalı olabilir.', ephemeral: true });
            }
        }
        else if (subcommand === 'cik') {
            const left = await groupService_1.groupService.leaveGroup(interaction.user.id);
            if (left) {
                await interaction.reply({ content: '✅ Gruptan ayrıldınız!', ephemeral: true });
            }
            else {
                await interaction.reply({ content: '❌ Bir grupta değilsiniz!', ephemeral: true });
            }
        }
        else if (subcommand === 'bilgi') {
            const group = await groupService_1.groupService.getUserGroup(interaction.user.id);
            if (!group) {
                return interaction.reply({ content: '❌ Bir grupta değilsiniz!', ephemeral: true });
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setColor(0x3498db)
                .setTitle(`👥 ${group.name}`)
                .setDescription(`**Grup ID:** \`${group.id}\``)
                .addFields({ name: 'Üyeler', value: group.members.map((m, i) => `${i + 1}. <@${m}>`).join('\n') }, { name: 'Üye Sayısı', value: `${group.members.length}/5`, inline: true })
                .setTimestamp(group.createdAt instanceof Date ? group.createdAt : new Date(group.createdAt));
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};
