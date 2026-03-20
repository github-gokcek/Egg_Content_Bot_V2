import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { getAdChannel } from '../services/botSettings';
import path from 'path';
import { existsSync } from 'fs';

async function sendAdMessage(interaction: ChatInputCommandInteraction): Promise<void> {
  const adChannelId = await getAdChannel();
  
  if (!adChannelId) {
    await interaction.reply({ content: '❌ Reklam kanalı ayarlanmamış! `/set reklam` komutuyla ayarlayın.', ephemeral: true });
    return;
  }

  const channel = await interaction.client.channels.fetch(adChannelId);
  
  if (!channel || !channel.isTextBased()) {
    await interaction.reply({ content: '❌ Reklam kanalı bulunamadı!', ephemeral: true });
    return;
  }

  const imagePath = path.join(process.cwd(), 'assetler', 'Ninja.png');
  
  // Görsel dosyası kontrolü
  if (!existsSync(imagePath)) {
    await interaction.reply({ content: '❌ Reklam görseli bulunamadı! (assetler/Ninja.png)', ephemeral: true });
    return;
  }
  
  const attachment = new AttachmentBuilder(imagePath);

  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('🎮 Botun Tüm Özelliklerini Keşfet!')
    .setDescription(
      '**Casino sistemini** denediniz mi? 🎰\n' +
      '**RPG maceralarına** katıldınız mı? ⚔️\n' +
      '**Günlük görevlerinizi** tamamladınız mı? 📋\n\n' +
      '**Komutları keşfet:** `/yardim`'
    )
    .setImage('attachment://Ninja.png')
    .setTimestamp();

  await channel.send({ embeds: [embed], files: [attachment] });
  await interaction.reply({ content: '✅ Reklam mesajı gönderildi!', ephemeral: true });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bot')
    .setDescription('Bot yönetim komutları')
    .addSubcommand(subcommand =>
      subcommand
        .setName('reklam')
        .setDescription('Reklam mesajını manuel olarak gönder')
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'reklam') {
      await sendAdMessage(interaction);
    }
  },
};

export { sendAdMessage };
