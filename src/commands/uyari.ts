import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { addMajorWarning } from '../services/warningService';

export const data = new SlashCommandBuilder()
  .setName('uyari')
  .setDescription('Kullanıcıya büyük uyarı ver')
  .addUserOption(option =>
    option.setName('kullanici')
      .setDescription('Uyarılacak kullanıcı')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('sebep')
      .setDescription('Uyarı sebebi')
      .setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  const targetUser = interaction.options.getUser('kullanici', true);
  const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi';
  const member = await interaction.guild?.members.fetch(targetUser.id);

  if (!member) {
    return interaction.reply({ content: '❌ Kullanıcı bulunamadı!', ephemeral: true });
  }

  // Uyarı rolünü bul
  const warningRole = interaction.guild?.roles.cache.find(r => r.name === 'Uyarı');
  if (!warningRole) {
    return interaction.reply({ content: '❌ "Uyarı" rolü bulunamadı! Lütfen önce bu rolü oluşturun.', ephemeral: true });
  }

  // Uyarı sayısını artır
  const warningCount = await addMajorWarning(interaction.guildId!, targetUser.id);

  // Rolü ver
  await member.roles.add(warningRole);

  // Embed oluştur
  const embed = new EmbedBuilder()
    .setColor(warningCount >= 2 ? 0xFF0000 : 0xFFA500)
    .setTitle('⚠️ Büyük Uyarı')
    .setDescription(`${targetUser} kullanıcısına uyarı verildi!`)
    .addFields(
      { name: 'Sebep', value: reason },
      { name: 'Toplam Uyarı', value: `${warningCount}/2`, inline: true },
      { name: 'Yetkili', value: interaction.user.tag, inline: true }
    )
    .setTimestamp();

  if (warningCount >= 2) {
    embed.addFields({ name: '⚠️ Dikkat', value: 'Kullanıcı 2. uyarısını aldı! Sunucudan atabilirsiniz.' });
  }

  // Kullanıcıya DM gönder
  try {
    const dmMessage = warningCount >= 2 
      ? `**${interaction.guild?.name}** sunucusunda 2. büyük uyarınızı aldınız!\n**Sebep:** ${reason}\n**UYARI:** Bir sonraki uyarıda sunucudan atılabilirsiniz!`
      : `**${interaction.guild?.name}** sunucusunda büyük uyarı aldınız!\n**Sebep:** ${reason}\n**Uyarı:** ${warningCount}/2 - Bir uyarı daha alırsanız sunucudan atılabilirsiniz!`;
    await member.send(dmMessage);
  } catch (error) {
    embed.setFooter({ text: 'Kullanıcıya DM gönderilemedi' });
  }

  await interaction.reply({ embeds: [embed] });
}
