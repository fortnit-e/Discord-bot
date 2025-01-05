import { EmbedBuilder } from 'discord.js';

export async function logError(client, error, context) {
    try {
        const errorChannel = await client.channels.fetch('1325241496232005703');
        if (!errorChannel) {
            console.error('Error channel not found');
            return;
        }

        const embed = new EmbedBuilder()
            .setColor('Red')
            .setTitle('❌ Error Occurred')
            .setDescription(`\`\`\`${error.stack || error.message || error}\`\`\``)
            .addFields(
                { name: 'Command', value: context.command || 'N/A', inline: true },
                { name: 'User', value: context.user || 'N/A', inline: true },
                { name: 'Channel', value: context.channel || 'N/A', inline: true }
            )
            .setTimestamp();

        await errorChannel.send({ embeds: [embed] });
    } catch (err) {
        console.error('Error in error logger:', err);
    }
} 