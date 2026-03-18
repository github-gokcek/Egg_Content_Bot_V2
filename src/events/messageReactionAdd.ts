import { Events, MessageReaction, User } from 'discord.js';
import { questService } from '../services/questService';
import { Logger } from '../utils/logger';

module.exports = {
  name: Events.MessageReactionAdd,
  async execute(reaction: MessageReaction, user: User) {
    // Bot reactionlarını ignore et
    if (user.bot) return;

    try {
      // Partial reaction ise fetch et
      if (reaction.partial) {
        try {
          await reaction.fetch();
        } catch (error) {
          Logger.error('Reaction fetch error', error);
          return;
        }
      }
      
      // Partial message ise fetch et
      if (reaction.message.partial) {
        try {
          await reaction.message.fetch();
        } catch (error) {
          Logger.error('Message fetch error', error);
          return;
        }
      }

      // Mesaj sahibi bilgisi yoksa çık
      if (!reaction.message.author) {
        Logger.warn('Message author not found', { messageId: reaction.message.id });
        return;
      }

      const messageAuthorId = reaction.message.author.id;
      
      // Emoji bilgisini al
      const emoji = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;

      // Reaction veren kişi için tracking
      await questService.trackReactionGiven(user.id, reaction.message.id, messageAuthorId, emoji);

      // Mesaj sahibi için tracking (kendi mesajına reaction vermediyse)
      if (messageAuthorId !== user.id && !reaction.message.author.bot) {
        await questService.trackReactionReceived(messageAuthorId, reaction.message.id);
      }
      
      Logger.info('Reaction tracked', { 
        userId: user.id, 
        messageId: reaction.message.id, 
        authorId: messageAuthorId 
      });
    } catch (error) {
      Logger.error('Reaction tracking error', error);
    }
  },
};
