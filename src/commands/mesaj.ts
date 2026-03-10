import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, TextChannel } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('mesaj')
  .setDescription('Bot ağzından mesaj gönder')
  .addStringOption(option =>
    option.setName('icerik')
      .setDescription('Gönderilecek mesaj')
      .setRequired(true))
  .addChannelOption(option =>
    option.setName('kanal')
      .setDescription('Mesajın gönderileceği kanal')
      .setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const targetChannel = interaction.options.getChannel('kanal') as TextChannel || interaction.channel as TextChannel;
  const content = interaction.options.getString('icerik', true);

  if (!targetChannel.isTextBased()) {
    return interaction.reply({ content: '❌ Sadece metin kanallarına mesaj gönderilebilir!', ephemeral: true });
  }

  await targetChannel.send(content);
  await interaction.reply({ content: `✅ Mesaj ${targetChannel} kanalına gönderildi!`, ephemeral: true });
}
