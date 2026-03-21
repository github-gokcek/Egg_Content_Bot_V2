"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoDeleteMessage = autoDeleteMessage;
const DELETE_DELAY = 65000; // 65 seconds
async function autoDeleteMessage(message) {
    setTimeout(async () => {
        try {
            // InteractionResponse ise önce Message'a çevir
            if ('fetch' in message) {
                const fetchedMessage = await message.fetch();
                if (fetchedMessage.deletable) {
                    await fetchedMessage.delete();
                }
            }
            else if (message.deletable) {
                await message.delete();
            }
        }
        catch (error) {
            // Silently ignore deletion errors
        }
    }, DELETE_DELAY);
}
