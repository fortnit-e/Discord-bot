import { EmbedBuilder } from 'discord.js';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
                .setTitle('🔄 Restarting Bot')
                .setDescription('Bot is restarting...')
                .setFooter({ 
                    text: `Requested by ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL()
                })
                .setTimestamp();

            const statusMessage = await message.channel.send({ embeds: [embed] });

            // Save restart info to .env file
            process.env.RESTART_CHANNEL = message.channel.id;
            process.env.RESTART_MESSAGE = statusMessage.id;

            // Get the path to restart.bat
            const restartScript = path.join(__dirname, '..', 'restart.bat');

            // Start the restart script in a new window
            exec(`start cmd.exe /c "${restartScript}"`, (error) => {
                if (error) {
                    console.error(`Error during restart: ${error}`);
                    return;
                }
                // Exit current instance
                process.exit();
            });

        } catch (error) {
            console.error('Error in restart command:', error);
            await message.reply('❌ An error occurred while trying to restart the bot.');
        }
    },
}; 