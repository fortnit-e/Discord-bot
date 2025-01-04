import { EmbedBuilder } from 'discord.js';

export async function logError(client, error, context) {
    const errorChannel = await client.channels.fetch('1325241496232005703');
    if (!errorChannel) return;

    const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('Error Occurred')
        .setDescription(`\`\`\`${error.stack}\`\`\``)
        .addFields(
            { name: 'Context', value: JSON.stringify(context, null, 2) }
        )
        .setTimestamp();

    await errorChannel.send({ embeds: [embed] });
} 