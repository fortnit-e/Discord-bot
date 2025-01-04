export default {
    name: 'purge',
    description: 'Delete multiple messages at once',
    async execute(message, args) {
        if (!message.member.permissions.has('ManageMessages')) {
            return message.reply('❌ You need Manage Messages permission to use this command.');
        }

        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100) {
            return message.reply('Please provide a number between 1 and 100.');
        }

        try {
            await message.channel.bulkDelete(amount + 1);
            const reply = await message.channel.send(`✅ Deleted ${amount} messages.`);
            setTimeout(() => reply.delete(), 3000);
        } catch (error) {
            console.error('Error in purge command:', error);
            await message.reply('❌ Could not delete messages.');
        }
    }
}; 