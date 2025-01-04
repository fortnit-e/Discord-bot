export default {
    name: 'ping',
    description: 'Replies with Pong!',
    async execute(message, args) {
      const sent = await message.reply('Pinging...');
      const latency = sent.createdTimestamp - message.createdTimestamp;
      await sent.edit(`Pong! Latency is ${latency}ms. API Latency is ${Math.round(message.client.ws.ping)}ms`);
    },
  };