import { EmbedBuilder } from 'discord.js';
import { logError } from '../utils/errorLogger.js';
import { YuniteAPI } from '../utils/yuniteAPI.js';

export default {
  name: 'registration',
  description: 'Get registration data from Yunite',
  async execute(message, args) {
    try {
      // Initialize the Yunite API with your API key
      const yunite = new YuniteAPI(process.env.YUNITE_API_KEY, message.client);

      // Get the guild ID from the message
      const guildId = message.guild.id;

      // Fetch registration data
      const data = await yunite.getRegistrationData(guildId);

      // Format and send the response
      const response = `Registration Data:\n${JSON.stringify(data, null, 2)}`;
      await message.reply({
        content: response,
        split: true // Split message if it's too long
      });

    } catch (error) {
      await logError(message.client, error, {
        command: 'registration',
        user: message.author.tag,
        channel: message.channel.name,
        args: args.join(' ')
      });
      await message.reply('❌ An error occurred during registration.');
    }
  },
};