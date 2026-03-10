import { ContextMenuCommandBuilder, ApplicationCommandType, PermissionFlagsBits, MessageContextMenuCommandInteraction } from 'discord.js';
import { addChatWarning } from '../services/warningService';

export const data = new ContextMenuCommandBuilder()
  .setName('Mesajı Uyar')
  .setType(ApplicationCommandType.Message)
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: MessageContextMenuCommandInteraction) {
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
  } catch (error) {
    return interaction.editReply({ content: '❌ Mesaj silinemedi!' });
  }

  // Uyarı sayısını artır
  const warningCount = await addChatWarning(interaction.guildId!, targetUser.id);

  // Rolü ver
  await member.roles.add(chatWarningRole);

  // Kanala uyarı mesajı gönder
  await interaction.channel?.send(`${targetUser} **Bu mesajı bir daha atma!** (Chat Uyarısı: ${warningCount})`);

  // Kullanıcıya DM gönder
  try {
    await member.send(`**${interaction.guild?.name}** sunucusunda chat uyarısı aldınız!\nMesajınız silindi ve bir daha bu tür mesajlar atmamanız bekleniyor.\n**Chat Uyarı Sayınız:** ${warningCount}`);
  } catch (error) {
    // DM gönderilemezse devam et
  }

  await interaction.editReply({ content: `✅ ${targetUser.tag} kullanıcısına chat uyarısı verildi ve mesaj silindi!` });
}
