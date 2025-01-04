import { EmbedBuilder } from 'discord.js';

export default {
  name: 'next',
  description: 'Calculate the next time rounded to the nearest 5 minutes and display it as a Discord timestamp',
  async execute(message) {
    // Get current time and add 26 minutes
    const now = new Date();
    const futureTime = new Date(now.getTime() + 26 * 60 * 1000); // Add 26 minutes

    // Round to the nearest 5 minutes
    const minutes = Math.ceil(futureTime.getMinutes() / 5) * 5;
    futureTime.setMinutes(minutes, 0, 0);

    // Format the timestamp in Discord syntax <t:timestamp:TYPE>
    const timestamp = `<t:${Math.floor(futureTime.getTime() / 1000)}:t>`;

    // Create an embed message using EmbedBuilder
    const embed = new EmbedBuilder()
      .setColor('#0099FF')
      .setTitle('Next Game')
      .setDescription(`The next match is @ ${timestamp}`)
      .setTimestamp()
      .setFooter({ text: 'Match info' });

    // Send the embed message
    await message.channel.send({ embeds: [embed] });
  },
};