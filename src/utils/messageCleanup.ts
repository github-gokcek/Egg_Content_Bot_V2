import { Message, InteractionResponse } from 'discord.js';

const DELETE_DELAY = 65000; // 65 seconds

export async function autoDeleteMessage(message: Message | InteractionResponse): Promise<void> {
  setTimeout(async () => {
    try {
      // InteractionResponse ise önce Message'a çevir
      if ('fetch' in message) {
        const fetchedMessage = await message.fetch();
        if (fetchedMessage.deletable) {
          await fetchedMessage.delete();
        }
      } else if (message.deletable) {
        await message.delete();
      }
    } catch (error) {
      // Silently ignore deletion errors
    }
  }, DELETE_DELAY);
}
