import { YuniteAPI } from '../utils/yuniteAPI.js';
import { EmbedBuilder } from 'discord.js';
import { logError } from '../utils/errorLogger.js';

export default {
  name: 'epicid',
  description: 'Get the Epic ID of a user',
  async execute(message, args) {
    if (!message.guild) {
      return message.reply('This command can only be used in a server!');
    }

    const targetUser = message.mentions.users.first() || message.author;

    try {
      const yunite = new YuniteAPI(process.env.YUNITE_API_KEY);
      const epicId = await yunite.getEpicId(message.guild.id, targetUser.id);

      if (epicId) {
        await message.reply(`The Epic ID for ${targetUser.username} is: ${epicId}`);
      } else {
        await message.reply(`No Epic ID found for ${targetUser.username}. They may not be linked.`);
      }
    } catch (error) {
      await logError(message.client, error, {
        command: 'epicid',
        user: message.author.tag,
        channel: message.channel.name,
        args: args.join(' ')
      });
      await message.reply('❌ An error occurred while fetching the Epic ID.');
    }
  },
};