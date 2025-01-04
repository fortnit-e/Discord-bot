export default {
    name: 'messageCreate',
    execute(message) {
      const { client, content, author } = message;
  
      if (author.bot || !content.startsWith(client.prefix)) return;
  
      const args = content.slice(client.prefix.length).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();
  
      const command = client.commands.get(commandName);
  
      if (!command) return;
  
      try {
        command.execute(message, args);
      } catch (error) {
        console.error(error);
        message.reply('There was an error trying to execute that command!');
      }
    },
  };