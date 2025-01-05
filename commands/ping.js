import { EmbedBuilder } from 'discord.js';
import { logError } from '../utils/errorLogger.js';

export default {
    name: 'ping',
    description: 'Check bot latency',
    async execute(message, args) {
        try {
            const sent = await message.reply('Pinging...');
            const latency = sent.createdTimestamp - message.createdTimestamp;
            const apiLatency = Math.round(message.client.ws.ping);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🏓 Pong!')
                .addFields(
                    { name: 'Bot Latency', value: `${latency}ms`, inline: true },
                    { name: 'API Latency', value: `${apiLatency}ms`, inline: true }
                );

            await sent.edit({ content: null, embeds: [embed] });
        } catch (error) {
            await logError(message.client, error, {
                command: 'ping',
                user: message.author.tag,
                channel: message.channel.name
            });
            await message.reply('❌ An error occurred while checking latency.');
        }
    },
};