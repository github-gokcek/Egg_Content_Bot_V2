"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const questService_1 = require("../services/questService");
const logger_1 = require("../utils/logger");
module.exports = {
    name: discord_js_1.Events.MessageReactionAdd,
    async execute(reaction, user) {
        // Bot reactionlarını ignore et
        if (user.bot)
            return;
        try {
            // Partial reaction ise fetch et
            if (reaction.partial) {
                try {
                    await reaction.fetch();
                }
                catch (error) {
                    logger_1.Logger.error('Reaction fetch error', error);
                    return;
                }
            }
            // Partial message ise fetch et
            if (reaction.message.partial) {
                try {
                    await reaction.message.fetch();
                }
                catch (error) {
                    logger_1.Logger.error('Message fetch error', error);
                    return;
                }
            }
            // Mesaj sahibi bilgisi yoksa çık
            if (!reaction.message.author) {
                logger_1.Logger.warn('Message author not found', { messageId: reaction.message.id });
                return;
            }
            const messageAuthorId = reaction.message.author.id;
            // Emoji bilgisini al
            const emoji = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;
            // Reaction veren kişi için tracking
            await questService_1.questService.trackReactionGiven(user.id, reaction.message.id, messageAuthorId, emoji);
            // Mesaj sahibi için tracking (kendi mesajına reaction vermediyse)
            if (messageAuthorId !== user.id && !reaction.message.author.bot) {
                await questService_1.questService.trackReactionReceived(messageAuthorId, reaction.message.id);
            }
            logger_1.Logger.info('Reaction tracked', {
                userId: user.id,
                messageId: reaction.message.id,
                authorId: messageAuthorId
            });
        }
        catch (error) {
            logger_1.Logger.error('Reaction tracking error', error);
        }
    },
};
