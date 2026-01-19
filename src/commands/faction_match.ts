import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { factionService } from '../services/factionService';
import { FactionType, FactionTier } from '../types/faction';
import { Logger } from '../utils/logger';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('faction_match')
    .setDescription('Faction vs Faction maç kur')
    .addStringOption(option =>
      option.setName('faction_a')
        .setDescription('Birinci faction')
        .setRequired(true)
        .addChoices(
          { name: '⚔️ Demacia', value: FactionType.DEMACIA },
          { name: '🏴☠️ Bilgewater', value: FactionType.BILGEWATER }
        )
    )
    .addStringOption(option =>
      option.setName('faction_b')
        .setDescription('İkinci faction')
        .setRequired(true)
        .addChoices(
          { name: '⚔️ Demacia', value: FactionType.DEMACIA },
          { name: '🏴☠️ Bilgewater', value: FactionType.BILGEWATER }
        )
    )
    .addBooleanOption(option =>
      option.setName('tier2_only')
        .setDescription('Sadece Tier 2 oyuncular katılabilsin mi?')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const factionA = interaction.options.getString('faction_a', true) as FactionType;
    const factionB = interaction.options.getString('faction_b', true) as FactionType;
    const tier2Only = interaction.options.getBoolean('tier2_only') || false;

    if (factionA === factionB) {
      return interaction.reply({ content: '❌ Aynı faction\'ı seçemezsiniz!', ephemeral: true });
    }

    // Check if user can create faction match
    const userFaction = await factionService.getUserFaction(interaction.user.id);
    if (!userFaction) {
      return interaction.reply({ content: '❌ Faction maçı kurmak için bir faction\'a üye olmalısınız!', ephemeral: true });
    }

    const matchId = `FM_${Date.now()}`;
    const tierText = tier2Only ? ' (Tier 2 Only)' : '';

    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle(`⚔️ Faction vs Faction Match${tierText}`)
      .setDescription(`**Match ID:** \`${matchId}\`\n\n${factionA.toUpperCase()} vs ${factionB.toUpperCase()}`)
      .addFields(
        { name: `⚔️ ${factionA.toUpperCase()} Takımı`, value: '*Henüz kimse katılmadı*', inline: true },
        { name: `🏴☠️ ${factionB.toUpperCase()} Takımı`, value: '*Henüz kimse katılmadı*', inline: true },
        { name: '📋 Kurallar', value: tier2Only ? '• Sadece Tier 2 oyuncular katılabilir\n• Her takımdan 5 oyuncu' : '• Her takımdan 5 oyuncu', inline: false }
      )
      .setFooter({ text: `Oluşturan: ${interaction.user.username}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    
    Logger.success('Faction match oluşturuldu', { matchId, factionA, factionB, tier2Only });
  },
};
