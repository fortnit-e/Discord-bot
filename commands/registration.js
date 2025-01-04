import { YuniteAPI } from '../utils/yuniteAPI.js';

export default {
  name: 'registration',
  description: 'Get registration data from Yunite',
  async execute(message, args) {
    try {
      // Initialize the Yunite API with your API key
      const yunite = new YuniteAPI(process.env.YUNITE_API_KEY);

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
      console.error('Error fetching registration data:', error);
      await message.reply('There was an error fetching the registration data from Yunite.');
    }
  },
};