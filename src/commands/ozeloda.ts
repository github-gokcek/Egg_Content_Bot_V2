import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType } from 'discord.js';
import { PrivateRoomService } from '../services/privateRoomService';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ozeloda')
    .setDescription('Özel oda sistemi')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub
        .setName('trigger')
        .setDescription('Trigger kanalını ayarla')
        .addChannelOption(option =>
          option
            .setName('kanal')
            .setDescription('Trigger ses kanalı')
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'trigger') {
      const channel = interaction.options.getChannel('kanal', true);
      
      if (channel.type !== ChannelType.GuildVoice) {
        return interaction.reply({ content: '❌ Lütfen bir ses kanalı seçin!', ephemeral: true });
      }

      const service = PrivateRoomService.getInstance();
      await service.setTriggerChannel(interaction.guildId!, channel.id);

      await interaction.reply({
        content: `✅ Özel oda trigger kanalı ${channel} olarak ayarlandı!\n\nKullanıcılar bu kanala girdiğinde kendilerine özel bir oda oluşturulacak.`,
        ephemeral: true
      });
    }
  },
};
