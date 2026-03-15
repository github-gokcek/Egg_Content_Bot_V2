import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { questService } from '../services/questService';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quest')
    .setDescription('Günlük görevlerini görüntüle')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Görevlerini görmek istediğin kullanıcı (opsiyonel)')
        .setRequired(false)),
  
  async execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    await interaction.deferReply();

    let userQuests = await questService.getUserQuests(targetUser.id);
    
    if (!userQuests) {
      userQuests = await questService.initializeUserQuests(targetUser.id);
    } else {
      await questService.checkAndResetDaily(targetUser.id);
      userQuests = await questService.getUserQuests(targetUser.id);
    }

    if (!userQuests) {
      return interaction.editReply({
        content: '❌ Görevler yüklenirken bir hata oluştu!'
      });
    }

    const completedCount = userQuests.quests.filter(q => q.completed).length;
    const totalReward = userQuests.quests
      .filter(q => q.completed)
      .reduce((sum, q) => sum + q.reward, 0);

    const questList = userQuests.quests.map(quest => {
      const progressBar = this.createProgressBar(quest.progress, quest.target);
      const status = quest.completed ? '✅' : '⏳';
      
      return `${quest.emoji} **${quest.name}** ${status}\n` +
             `${quest.description}\n` +
             `${progressBar} ${quest.progress}/${quest.target}\n` +
             `💰 Ödül: ${quest.reward} coin\n`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setColor(completedCount === 5 ? 0x00ff00 : 0x3498db)
      .setTitle(`📋 ${targetUser.username} - Günlük Görevler`)
      .setDescription(
        `**İlerleme:** ${completedCount}/5 görev tamamlandı\n` +
        `**Kazanılan:** ${totalReward} 🪙\n\n` +
        questList
      )
      .setFooter({ text: 'Görevler her gün sıfırlanır ve yeni görevler atanır!' })
      .setThumbnail(targetUser.displayAvatarURL())
      .setTimestamp();

    if (completedCount === 5) {
      embed.addFields({
        name: '🎉 Tebrikler!',
        value: 'Bugünün tüm görevlerini tamamladın!',
        inline: false
      });
    }

    await interaction.editReply({ embeds: [embed] });
  },

  createProgressBar(current: number, target: number): string {
    const percentage = Math.min(current / target, 1);
    const filled = Math.round(percentage * 10);
    const empty = 10 - filled;
    
    return '▰'.repeat(filled) + '▱'.repeat(empty);
  }
};
