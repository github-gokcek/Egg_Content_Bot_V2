import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ComponentBuilder } from '../utils/componentBuilder';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('oyun_kur')
    .setDescription('Yeni bir oyun oluştur'),
  async execute(interaction: ChatInputCommandInteraction) {
    const selectMenu = ComponentBuilder.createGameModeSelect();

    await interaction.reply({
      content: '🎮 **Oyun modu seçin:**',
      components: [selectMenu],
      ephemeral: true
    });
  },
};
