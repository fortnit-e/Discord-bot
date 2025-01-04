import { YuniteAPI } from '../utils/yuniteAPI.js';

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
      console.error('Error fetching Epic ID:', error);
      await message.reply(`An error occurred while fetching the Epic ID: ${error.message}`);
    }
  },
};