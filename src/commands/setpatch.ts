import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType } from 'discord.js';
import { patchNotesService } from '../services/patchNotesService';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setpatch')
    .setDescription('Patch notları kanalını ayarla')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option
        .setName('kanal')
        .setDescription('Patch notlarının paylaşılacağı kanal')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel('kanal', true);

    if (channel.type !== ChannelType.GuildText) {
      return interaction.reply({ content: '❌ Lütfen bir metin kanalı seçin!', ephemeral: true });
    }

    await patchNotesService.setPatchChannel(interaction.guildId!, channel.id);

    await interaction.reply({
      content: `✅ Patch notları kanalı ${channel} olarak ayarlandı!\n\n` +
        `🔔 Yeni LoL ve TFT patch notları otomatik olarak bu kanalda paylaşılacak.\n` +
        `📋 LoL patch'leri için @LoL rolü etiketlenecek.\n` +
        `📋 TFT patch'leri için @TFT rolü etiketlenecek.`,
      ephemeral: true
    });
  },
};
