import { GatewayIntentBits } from 'discord.js';

export const config = {
  token: process.env.DISCORD_TOKEN!,
  clientId: process.env.DISCORD_CLIENT_ID!,
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions, // Reaction event'leri için ZORUNLU!
    GatewayIntentBits.MessageContent, // Mesaj içeriği okumak için
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
};
