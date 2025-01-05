import { EmbedBuilder, ActivityType } from 'discord.js';
import { logError } from '../utils/errorLogger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESTART_FILE = path.join(__dirname, '..', 'restart-info.json');

function updatePresence(client) {
    let toggle = false;

    setInterval(() => {
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const totalServers = client.guilds.cache.size;

        if (toggle) {
            client.user.setActivity(`${totalUsers} users`, { type: ActivityType.Watching });
        } else {
            client.user.setActivity(`${totalServers} servers`, { type: ActivityType.Watching });
        }
        toggle = !toggle;
    }, 20000); // 20 seconds
}

export default {
    name: 'ready',
    once: true,
    async execute(client) {
        try {
            console.log(`Ready! Logged in as ${client.user.tag}`);
            
            // Initialize presence
            const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
            client.user.setActivity(`${totalUsers} users`, { type: ActivityType.Watching });
            
            // Start presence update cycle
            updatePresence(client);

            // Check for restart file
            const restartInfo = JSON.parse(await fs.readFile(RESTART_FILE, 'utf8').catch(() => '{}'));
            
            if (restartInfo.channelId && restartInfo.messageId) {
                const channel = await client.channels.fetch(restartInfo.channelId);
                if (channel) {
                    const message = await channel.messages.fetch(restartInfo.messageId);
                    if (message) {
                        const restartDuration = Math.floor((Date.now() - restartInfo.time) / 1000);

                        // Log successful restart to bot logs channel
                        const logChannel = await client.channels.fetch('1325241496232005703');
                        if (logChannel) {
                            const logEmbed = new EmbedBuilder()
                                .setColor('Green')
                                .setTitle('🔄 Bot Restart Completed')
                                .setDescription(
                                    '**Restart Details:**\n' +
                                    `• Duration: ${restartDuration} seconds\n` +
                                    `• Requested by: ${restartInfo.requester || 'Unknown'}\n` +
                                    `• Time: <t:${Math.floor(restartInfo.time / 1000)}:F>\n\n` +
                                    '**Status:**\n' +
                                    '• Bot is now online and operational'
                                )
                                .setTimestamp();

                            await logChannel.send({ embeds: [logEmbed] });
                        }

                        // Update the original restart message
                        const successEmbed = new EmbedBuilder()
                            .setColor('Green')
                            .setTitle('✅ Bot Online')
                            .setDescription(
                                '**Status:**\n' +
                                '• Restart completed successfully\n' +
                                '• All systems operational\n\n' +
                                `**Details:**\n` +
                                `• Restart duration: ${restartDuration} seconds\n` +
                                `• Requested by: ${restartInfo.requester || 'Unknown'}\n\n` +
                                '**Ready:**\n' +
                                '• Bot is now accepting commands'
                            )
                            .setTimestamp();

                        await message.edit({ embeds: [successEmbed] });
                        console.log('Restart completed successfully');
                    }
                }

                // Delete the restart file
                await fs.unlink(RESTART_FILE).catch(() => {});
            }
        } catch (error) {
            await logError(client, error, {
                command: 'Ready Event',
                type: 'Startup Error'
            });
            console.error('Error in ready event:', error);
        }
    },
};