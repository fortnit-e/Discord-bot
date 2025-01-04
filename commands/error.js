export default {
    name: 'error',
    description: 'Displays the latest errors from the bot logs',
    async execute(message) {
      try {
        const fs = await import('fs/promises'); // Use import for ES modules
        const path = './error.log'; // Replace with your actual error log file path
  
        const errorLog = await fs.readFile(path, 'utf8');
        if (!errorLog) {
          return message.reply('No recent errors logged.');
        }
  
        const logs = errorLog.split('\n').slice(-10); // Get last 10 lines of logs
        message.channel.send('Recent errors:\n' + logs.join('\n'));
      } catch (error) {
        console.error('Error reading the error log:', error);
        message.reply('Failed to retrieve error logs.');
      }
    },
  };