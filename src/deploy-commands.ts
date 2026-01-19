import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';

const commands = [];
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js') || file.endsWith('.ts'));

for (const file of commandFiles) {
  const command = require(join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log(`🔄 ${commands.length} komut yükleniyor...`);
    
    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      { body: commands },
    );

    console.log('✅ Komutlar başarıyla yüklendi!');
  } catch (error) {
    console.error(error);
  }
})();
