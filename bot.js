//Discord imports
const Discord = require('discord.js');
const client = new Discord.Client({ intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildMessageReactions,
    Discord.GatewayIntentBits.MessageContent,
  ]})
const token = "MTEyODc2NjkzOTA0MTM3MDEzMg.GlZbVJ.Il5lTJxwCaqlQmIthEpoBIw3OST2pohDRAJdTY";
//const redirectURI = "http://localhost:1443/delete";
const redirectURI = "http://mennessi.iiens.net/delete";

const axios = require('axios');
const cron = require('cron');

client.once('ready', () => {
    console.log("C'est tout good");
 });


// 00 min hr * * *
let scheduledMessage = new cron.CronJob('00 59 23 * * *', async () => {
  const res = await axios.post(redirectURI, {
    code: "iziLeCodeDuBot"
  });
});

scheduledMessage.start()

 client.login(token);