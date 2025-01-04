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
            // Send confirmation message
            const embed = new EmbedBuilder()
                .setColor('Yellow')
                .setTitle('🔄 Bot Restart Initiated')
                .setDescription(
                    '**Status:**\n' +
                    '• Saving state...\n' +
                    '• Preparing for restart...\n\n' +
                    '**Estimated Time:**\n' +
                    '• Bot should be back in ~30 seconds\n\n' +
                    '**Note:**\n' +
                    '• If bot doesn\'t respond after 1 minute, please contact an administrator.'
                )
                .setFooter({ 
                    text: `Requested by ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp();

            const statusMessage = await message.channel.send({ embeds: [embed] });

            // Store message info in environment variables
            process.env.RESTART_CHANNEL = message.channel.id;
            process.env.RESTART_MESSAGE = statusMessage.id;
            process.env.RESTART_TIME = Date.now().toString();

            // Log the restart attempt
            console.log(`Bot restart initiated by ${message.author.tag} at ${new Date().toISOString()}`);

            // Wait 2 seconds before exiting to ensure message is sent
            setTimeout(() => {
                process.exit(0);
            }, 2000);

        } catch (error) {
            console.error('Error in restart command:', error);
            await message.reply('❌ An error occurred while trying to restart the bot.');
        }
    },
}; 