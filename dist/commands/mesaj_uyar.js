"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const warningService_1 = require("../services/warningService");
exports.data = new discord_js_1.ContextMenuCommandBuilder()
    .setName('Mesajı Uyar')
    .setType(discord_js_1.ApplicationCommandType.Message)
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.ModerateMembers);
async function execute(interaction) {
    // Hemen yanıt ver (3 saniye timeout'u önlemek için)
    await interaction.deferReply({ flags: 64 }); // flags: 64 = ephemeral
    const message = interaction.targetMessage;
    const targetUser = message.author;
    if (targetUser.bot) {
        return interaction.editReply({ content: '❌ Botlara uyarı verilemez!' });
    }
    // Uyarı Chat rolünü bul
    const chatWarningRole = interaction.guild?.roles.cache.find(r => r.name === 'Uyarı Chat');
    if (!chatWarningRole) {
        return interaction.editReply({ content: '❌ "Uyarı Chat" rolü bulunamadı! Lütfen önce bu rolü oluşturun.' });
    }
    const member = await interaction.guild?.members.fetch(targetUser.id);
    if (!member) {
        return interaction.editReply({ content: '❌ Kullanıcı bulunamadı!' });
    }
    // Mesajı sil
    try {
        await message.delete();
    }
    catch (error) {
        return interaction.editReply({ content: '❌ Mesaj silinemedi!' });
    }
    // Uyarı sayısını artır
    const warningCount = await (0, warningService_1.addChatWarning)(interaction.guildId, targetUser.id);
    // Rolü ver
    await member.roles.add(chatWarningRole);
    // Kanala uyarı mesajı gönder
    await interaction.channel?.send(`${targetUser} **Bu mesajı bir daha atma!** (Chat Uyarısı: ${warningCount})`);
    // Kullanıcıya DM gönder
    try {
        await member.send(`**${interaction.guild?.name}** sunucusunda chat uyarısı aldınız!\nMesajınız silindi ve bir daha bu tür mesajlar atmamanız bekleniyor.\n**Chat Uyarı Sayınız:** ${warningCount}`);
    }
    catch (error) {
        // DM gönderilemezse devam et
    }
    await interaction.editReply({ content: `✅ ${targetUser.tag} kullanıcısına chat uyarısı verildi ve mesaj silindi!` });
}
