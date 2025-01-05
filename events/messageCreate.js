import { logError } from '../utils/errorLogger.js';

export default {
    name: 'messageCreate',
    async execute(message) {
        try {
            if (message.author.bot) return;
            if (!message.content.startsWith('!')) return;

            const args = message.content.slice(1).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            const command = message.client.commands.get(commandName);
            if (!command) return;

            await command.execute(message, args);
        } catch (error) {
            await logError(message.client, error, {
                command: 'messageCreate Event',
                user: message.author.tag,
                channel: message.channel.name,
                content: message.content
            });
            await message.reply('❌ There was an error executing that command.');
        }
    },
};