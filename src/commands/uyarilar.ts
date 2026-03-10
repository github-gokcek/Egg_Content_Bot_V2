import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getWarnings } from '../services/warningService';

export const data = new SlashCommandBuilder()
  .setName('uyarilar')
  .setDescription('Kullanıcının uyarılarını görüntüle')
  .addUserOption(option =>
    option.setName('kullanici')
      .setDescription('Uyarıları görüntülenecek kullanıcı')
      .setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  const targetUser = interaction.options.getUser('kullanici', true);
  const warnings = await getWarnings(interaction.guildId!, targetUser.id);

  const embed = new EmbedBuilder()
    .setColor(0x3498DB)
    .setTitle('📋 Uyarı Geçmişi')
    .setDescription(`${targetUser} kullanıcısının uyarı bilgileri`)
    .addFields(
      { name: '⚠️ Büyük Uyarılar', value: `${warnings?.majorWarnings || 0}/2`, inline: true },
      { name: '💬 Chat Uyarıları', value: `${warnings?.chatWarnings || 0}`, inline: true }
    )
    .setThumbnail(targetUser.displayAvatarURL())
    .setTimestamp();

  if (warnings?.lastWarningAt) {
    embed.addFields({ name: 'Son Uyarı', value: `<t:${Math.floor(new Date(warnings.lastWarningAt).getTime() / 1000)}:R>` });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
