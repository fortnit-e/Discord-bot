import { logError } from '../utils/errorLogger.js';

export default {
    name: 'ready',
    once: true,
    async execute(client) {
        try {
            console.log(`Ready! Logged in as ${client.user.tag}`);
            
            // Set bot status
            client.user.setActivity('!help', { type: 'WATCHING' });
        } catch (error) {
            await logError(client, error, {
                command: 'Ready Event',
                type: 'Startup Error'
            });
            console.error('Error in ready event:', error);
        }
    },
};