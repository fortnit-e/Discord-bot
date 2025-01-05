import { EmbedBuilder } from 'discord.js';
import { YuniteAPI } from '../utils/yuniteAPI.js';
import { logError } from '../utils/errorLogger.js';

export default {
    name: 'links',
    description: 'Check if a user is linked with their Epic account',
    async execute(message, args) {
        if (!message.guild) {
            return message.reply('This command can only be used in a server!');
        }

        try {
            const loadingMsg = await message.reply('🔄 Checking link status...');

            if (!process.env.YUNITE_API_KEY) {
                await loadingMsg.edit('❌ Error: Yunite API key is not configured.');
                return;
            }

            const yunite = new YuniteAPI(process.env.YUNITE_API_KEY);

            if (args[0]) {
                // Check specific user
                const userId = args[0].replace(/[<@!>]/g, '');
                try {
                    const user = await message.client.users.fetch(userId);
                    const epicId = await yunite.getEpicIdForUser(message.guild.id, userId);
                    
                    const embed = new EmbedBuilder()
                        .setColor(epicId ? '#00ff00' : '#ff0000')
                        .setTitle('Link Status Check')
                        .setDescription(`Status for ${user.tag}`)
                        .addFields({
                            name: 'Status',
                            value: epicId ? '✅ Linked' : '❌ Not Linked'
                        })
                        .setThumbnail(user.displayAvatarURL());

                    if (epicId) {
                        embed.addFields({
                            name: 'Epic ID',
                            value: epicId
                        });
                    }

                    await loadingMsg.edit({ embeds: [embed] });
                } catch (error) {
                    await logError(message.client, error, {
                        command: 'links',
                        user: message.author.tag,
                        channel: message.channel.name,
                        args: args.join(' ')
                    });
                    await loadingMsg.edit('❌ Error: Could not check user link status.');
                }
            } else {
                // Show total counts
                try {
                    const discordIds = await yunite.getLinkedUsers(message.guild.id, 'DISCORD');
                    const epicIds = await yunite.getLinkedUsers(message.guild.id, 'EPIC');

                    const embed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle('Linked Users Overview')
                        .addFields(
                            { 
                                name: 'Total Linked Users', 
                                value: `${discordIds.userIds.length}`, 
                                inline: true 
                            }
                        )
                        .setTimestamp();

                    await loadingMsg.edit({ embeds: [embed] });
                } catch (error) {
                    await logError(message.client, error, {
                        command: 'links',
                        user: message.author.tag,
                        channel: message.channel.name,
                        args: 'total count'
                    });
                    await loadingMsg.edit('❌ Error: Could not fetch linked users information.');
                }
            }
        } catch (error) {
            await logError(message.client, error, {
                command: 'links',
                user: message.author.tag,
                channel: message.channel.name
            });
            await message.reply('❌ An error occurred while checking link status.');
        }
    },
}; 