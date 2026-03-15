import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { questService } from '../services/questService';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rastgele')
    .setDescription('Zar at veya yazı tura at')
    .addStringOption(option =>
      option.setName('mode')
        .setDescription('Mod seçin (d2, d5, d10, d25, d50, d100, yazı-tura)')
        .setRequired(true)
        .addChoices(
          { name: 'D2 (1-2)', value: 'd2' },
          { name: 'D5 (1-5)', value: 'd5' },
          { name: 'D10 (1-10)', value: 'd10' },
          { name: 'D25 (1-25)', value: 'd25' },
          { name: 'D50 (1-50)', value: 'd50' },
          { name: 'D100 (1-100)', value: 'd100' },
          { name: 'Yazı Tura', value: 'yazı-tura' }
        ))
    .addIntegerOption(option =>
      option.setName('count')
        .setDescription('Kaç defa atılacak (varsayılan: 1)')
        .setMinValue(1)
        .setMaxValue(10)),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const mode = interaction.options.getString('mode', true);
    const count = interaction.options.getInteger('count') || 1;

    if (mode === 'yazı-tura') {
      const results = [];
      for (let i = 0; i < count; i++) {
        results.push(Math.random() < 0.5 ? 'Yazı' : 'Tura');
      }
      
      const resultText = count === 1 
        ? `🪙 ${results[0]}`
        : results.map((r, i) => `${i + 1}. 🪙 ${r}`).join('\n');
      
      await interaction.reply(`**Yazı Tura Sonucu:**\n${resultText}`);
    } else {
      const maxValue = parseInt(mode.substring(1));
      const results = [];
      
      for (let i = 0; i < count; i++) {
        results.push(Math.floor(Math.random() * maxValue) + 1);
      }
      
      const resultText = count === 1
        ? `🎲 ${results[0]}`
        : results.map((r, i) => `${i + 1}. 🎲 ${r}`).join('\n');
      
      const total = results.reduce((a, b) => a + b, 0);
      const summary = count > 1 ? `\n**Toplam:** ${total}` : '';
      
      await interaction.reply(`**${mode.toUpperCase()} Sonucu:**\n${resultText}${summary}`);
    }

    // Quest tracking
    try {
      await questService.trackRastgeleUsed(interaction.user.id);
    } catch (error) {
      console.error('Quest tracking error:', error);
    }
  },
};
