require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.once('ready', () => {
  console.log(`✅ Bot ${client.user.tag} olarak giriş yaptı!`);
});

client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  if (message.content === '!ping') {
    message.reply(`🏓 Pong! Latency: ${client.ws.ping}ms`);
  }

  if (message.content === '!hello') {
    message.reply(`Merhaba ${message.author}! 👋`);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply(`🏓 Pong! ${client.ws.ping}ms`);
  }
});

client.login(process.env.DISCORD_TOKEN);
