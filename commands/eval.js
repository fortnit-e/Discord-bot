import { EmbedBuilder, codeBlock } from 'discord.js';
import { logError } from '../utils/errorLogger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESTART_FILE = path.join(__dirname, '..', 'restart-info.json');

export default {
    name: 'eval',
    description: 'Shows detailed bot and server information',
    async execute(message, args) {
        try {
            const client = message.client;
            const guild = message.guild;

            // Get bot uptime
            const uptime = {
                days: Math.floor(client.uptime / 86400000),
                hours: Math.floor(client.uptime / 3600000) % 24,
                minutes: Math.floor(client.uptime / 60000) % 60,
                seconds: Math.floor(client.uptime / 1000) % 60
            };

            // Get last restart time
            let lastRestart = 'No restart data available';
            try {
                const restartInfo = JSON.parse(await fs.readFile(RESTART_FILE, 'utf8'));
                lastRestart = `<t:${Math.floor(restartInfo.time / 1000)}:R>`;
            } catch (err) {
                console.error('No restart file found');
            }

            // Get all commands
            const commands = Array.from(client.commands.keys());
            const commandsList = codeBlock('apache', commands.map(cmd => `!${cmd}`).join('\n'));

            // Get server information
            const serverInfo = {
                totalMembers: guild.memberCount,
                onlineMembers: guild.members.cache.filter(m => m.presence?.status !== 'offline').size,
                totalChannels: guild.channels.cache.size,
                textChannels: guild.channels.cache.filter(c => c.type === 0).size,
                voiceChannels: guild.channels.cache.filter(c => c.type === 2).size,
                roles: guild.roles.cache.size,
                emojis: guild.emojis.cache.size,
                boostLevel: guild.premiumTier,
                boostCount: guild.premiumSubscriptionCount
            };

            // Create embed
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('📊 Bot & Server Statistics')
                .addFields(
                    {
                        name: '🤖 Bot Information',
                        value: [
                            `**Uptime:** ${uptime.days}d ${uptime.hours}h ${uptime.minutes}m ${uptime.seconds}s`,
                            `**Last Restart:** ${lastRestart}`,
                            `**Servers:** ${client.guilds.cache.size}`,
                            `**Ping:** ${client.ws.ping}ms`,
                            `**Memory Usage:** ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '🏠 Server Information',
                        value: [
                            `**Name:** ${guild.name}`,
                            `**Owner:** <@${guild.ownerId}>`,
                            `**Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
                            `**Members:** ${serverInfo.totalMembers} total (${serverInfo.onlineMembers} online)`,
                            `**Channels:** ${serverInfo.totalChannels} (${serverInfo.textChannels} text, ${serverInfo.voiceChannels} voice)`,
                            `**Roles:** ${serverInfo.roles}`,
                            `**Emojis:** ${serverInfo.emojis}`,
                            `**Boost Level:** ${serverInfo.boostLevel} (${serverInfo.boostCount} boosts)`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '⌨️ Available Commands',
                        value: commandsList,
                        inline: false
                    }
                )
                .setFooter({ 
                    text: `Requested by ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp();

            await message.reply({ embeds: [embed] });

        } catch (error) {
            await logError(message.client, error, {
                command: 'eval',
                user: message.author.tag,
                channel: message.channel.name
            });
            await message.reply('❌ An error occurred while fetching information.');
        }
    },
}; 