import { EmbedBuilder } from 'discord.js';
import { logError } from '../utils/errorLogger.js';

export default {
    name: 'purge',
    description: 'Delete multiple messages at once',
    async execute(message, args) {
        try {
            if (!message.member.permissions.has('ManageMessages')) {
                return message.reply('❌ You need Manage Messages permission to use this command.');
            }

            const amount = parseInt(args[0]);
            if (isNaN(amount) || amount < 1 || amount > 100) {
                return message.reply('Please provide a number between 1 and 100.');
            }

            await message.channel.bulkDelete(amount + 1);
            const reply = await message.channel.send(`✅ Deleted ${amount} messages.`);
            setTimeout(() => reply.delete(), 3000);

        } catch (error) {
            await logError(message.client, error, {
                command: 'purge',
                user: message.author.tag,
                channel: message.channel.name,
                amount: args[0]
            });
            await message.reply('❌ Could not delete messages. Messages older than 14 days cannot be bulk deleted.');
        }
    },
}; 