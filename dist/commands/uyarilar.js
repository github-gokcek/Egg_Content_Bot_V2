"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const warningService_1 = require("../services/warningService");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('uyarilar')
    .setDescription('Kullanıcının uyarılarını görüntüle')
    .addUserOption(option => option.setName('kullanici')
    .setDescription('Uyarıları görüntülenecek kullanıcı')
    .setRequired(true))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers);
async function execute(interaction) {
    const targetUser = interaction.options.getUser('kullanici', true);
    const warnings = await (0, warningService_1.getWarnings)(interaction.guildId, targetUser.id);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle('📋 Uyarı Geçmişi')
        .setDescription(`${targetUser} kullanıcısının uyarı bilgileri`)
        .addFields({ name: '⚠️ Büyük Uyarılar', value: `${warnings?.majorWarnings || 0}/2`, inline: true }, { name: '💬 Chat Uyarıları', value: `${warnings?.chatWarnings || 0}`, inline: true })
        .setThumbnail(targetUser.displayAvatarURL())
        .setTimestamp();
    if (warnings?.lastWarningAt) {
        embed.addFields({ name: 'Son Uyarı', value: `<t:${Math.floor(new Date(warnings.lastWarningAt).getTime() / 1000)}:R>` });
    }
    await interaction.reply({ embeds: [embed], ephemeral: true });
}
