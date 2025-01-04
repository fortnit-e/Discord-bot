import { EmbedBuilder } from 'discord.js';

export default {
    name: 'restart',
    description: 'Restarts the bot (Owner/Admin only)',
    async execute(message, args) {
        // Check if user is server owner or admin
        if (!message.member.permissions.has('Administrator') && message.author.id !== message.guild.ownerId) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('❌ Permission Denied')
                .setDescription('Only server administrators or the owner can restart the bot.');
            
            const reply = await message.channel.send({ embeds: [embed] });
            setTimeout(() => reply.delete().catch(() => {}), 5000);
            return;
        }

        try {
            // Send initial status message
            const embed = new EmbedBuilder()
                .setColor('Yellow')
                .setTitle('🔄 Bot Restart Sequence')
                .setDescription(
                    '**Current Status:**\n' +
                    '• Initiating restart sequence...\n' +
                    '• Saving current state...\n\n' +
                    '**Important:**\n' +
                    '• Please wait while Railway redeploys the bot\n' +
                    '• This may take 1-2 minutes\n\n' +
                    '**Troubleshooting:**\n' +
                    '• If bot is offline > 3 minutes, check Railway dashboard\n' +
                    '• Contact administrator if issues persist'
                )
                .setFooter({ 
                    text: `Requested by ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp();

            const statusMessage = await message.channel.send({ embeds: [embed] });

            // Update status to shutting down
            setTimeout(async () => {
                const updatedEmbed = new EmbedBuilder()
                    .setColor('Orange')
                    .setTitle('🔄 Bot Shutting Down')
                    .setDescription(
                        '**Status Update:**\n' +
                        '• Bot is shutting down...\n' +
                        '• Waiting for Railway redeploy...\n\n' +
                        '**Please Note:**\n' +
                        '• Bot will be offline briefly\n' +
                        '• Status will update when back online'
                    )
                    .setFooter({ 
                        text: `Requested by ${message.author.tag}`,
                        iconURL: message.author.displayAvatarURL()
                    })
                    .setTimestamp();

                await statusMessage.edit({ embeds: [updatedEmbed] });

                // Store message info
                process.env.RESTART_CHANNEL = message.channel.id;
                process.env.RESTART_MESSAGE = statusMessage.id;
                process.env.RESTART_TIME = Date.now().toString();
                process.env.RESTART_REQUESTER = message.author.tag;

                // Exit after ensuring message is updated
                setTimeout(() => {
                    console.log(`Bot restart initiated by ${message.author.tag} at ${new Date().toISOString()}`);
                    process.exit(0);
                }, 1000);
            }, 3000);

        } catch (error) {
            console.error('Error in restart command:', error);
            await message.reply('❌ An error occurred while trying to restart the bot.');
        }
    },
}; 