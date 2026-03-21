"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const warningService_1 = require("../services/warningService");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('uyarisil')
    .setDescription('Kullanıcının uyarısını geri çek')
    .addUserOption(option => option.setName('kullanici')
    .setDescription('Uyarısı silinecek kullanıcı')
    .setRequired(true))
    .addStringOption(option => option.setName('tip')
    .setDescription('Silinecek uyarı tipi')
    .setRequired(true)
    .addChoices({ name: 'Büyük Uyarı', value: 'major' }, { name: 'Chat Uyarısı', value: 'chat' }))
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator);
async function execute(interaction) {
    const targetUser = interaction.options.getUser('kullanici', true);
    const warningType = interaction.options.getString('tip', true);
    const member = await interaction.guild?.members.fetch(targetUser.id);
    if (!member) {
        return interaction.reply({ content: '❌ Kullanıcı bulunamadı!', ephemeral: true });
    }
    let newCount = 0;
    let roleName = '';
    if (warningType === 'major') {
        newCount = await (0, warningService_1.removeMajorWarning)(interaction.guildId, targetUser.id);
        roleName = 'Uyarı';
        // Eğer büyük uyarı kalmadıysa rolü kaldır
        if (newCount === 0) {
            const warningRole = interaction.guild?.roles.cache.find(r => r.name === 'Uyarı');
            if (warningRole && member.roles.cache.has(warningRole.id)) {
                await member.roles.remove(warningRole);
            }
        }
    }
    else {
        newCount = await (0, warningService_1.removeChatWarning)(interaction.guildId, targetUser.id);
        roleName = 'Uyarı Chat';
        // Eğer chat uyarısı kalmadıysa rolü kaldır
        if (newCount === 0) {
            const chatWarningRole = interaction.guild?.roles.cache.find(r => r.name === 'Uyarı Chat');
            if (chatWarningRole && member.roles.cache.has(chatWarningRole.id)) {
                await member.roles.remove(chatWarningRole);
            }
        }
    }
    const warnings = await (0, warningService_1.getWarnings)(interaction.guildId, targetUser.id);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Uyarı Geri Çekildi')
        .setDescription(`${targetUser} kullanıcısının ${warningType === 'major' ? 'büyük uyarısı' : 'chat uyarısı'} geri çekildi!`)
        .addFields({ name: '⚠️ Kalan Büyük Uyarılar', value: `${warnings?.majorWarnings || 0}/2`, inline: true }, { name: '💬 Kalan Chat Uyarıları', value: `${warnings?.chatWarnings || 0}`, inline: true }, { name: 'Yetkili', value: interaction.user.tag, inline: true })
        .setTimestamp();
    // Kullanıcıya DM gönder
    try {
        await member.send(`**${interaction.guild?.name}** sunucusunda ${warningType === 'major' ? 'büyük uyarınız' : 'chat uyarınız'} geri çekildi!\n**Kalan Uyarılar:** Büyük: ${warnings?.majorWarnings || 0}/2, Chat: ${warnings?.chatWarnings || 0}`);
    }
    catch (error) {
        embed.setFooter({ text: 'Kullanıcıya DM gönderilemedi' });
    }
    await interaction.reply({ embeds: [embed] });
}
