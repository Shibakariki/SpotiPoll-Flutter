//Discord imports
const Discord = require('discord.js');
const client = new Discord.Client({ intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildMessageReactions,
    Discord.GatewayIntentBits.MessageContent,
  ]})
const token = process.env.DISCORD_TOKEN;
const redirectURI = process.env.REDIRECT_URL

const axios = require('axios');
const cron = require('cron');
const fs = require("fs");

client.once('ready', () => {
    console.log("C'est tout good");
 });

let resultMessage = new cron.CronJob('00 00 00 * * *', async () => {
  const res = await axios.get(redirectURI+"result");
  console.log(res.data);
  const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
  channel.send(res.data);
});

let sendReminderDM = new cron.CronJob('00 44 23 * * *', async () => {
  //Send DM to a user with is id
  const user1 = await client.users.fetch('292409251916152832'); //Axel
  const user2 = await client.users.fetch('557505245505257476'); //Céline
  const user3 = await client.users.fetch('882166624717770812'); //Maxime
  var users = [];

  var jsonData = [];
  if ( !fs.existsSync('./views/static/fichier.json')) { fs.writeFile(filePath, jsonData, 'utf8', () => {}) }
  fs.readFile('./views/static/fichier.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    parseJson = JSON.parse(data);
    var usersData = parseJson["users"].map(user => new User(user.id,user.name,user.vote,user.push_vote));

    usersData.forEach(user => {
      if (user.vote === 0)
      {
        switch (user.id) {
          case 'uudinn':
            users.push(user1);
            break;
          case '11183209297':
            users.push(user2);
            break;
          case '8oyik21m36g0xygzkhomv46ah':
            users.push(user3);
            break;
          default:
            break;
        }
      }
    });

    users.forEach(user => { 
      user.send('Yooo! Tu as oublié de voter aujourd\'hui! (vite plus que 15min) => https://mennessi.iiens.net/poll');
    });

  });
});

let sendResultDM = new cron.CronJob('00 00 00 * * *', async () => {
  const res = await axios.get(redirectURI+"result");
  const user1 = await client.users.fetch('292409251916152832'); //Axel
  const user2 = await client.users.fetch('557505245505257476'); //Céline
  const user3 = await client.users.fetch('882166624717770812'); //Maxime
  var users = [user1,user2,user3];

  users.forEach(user => {
    user.send(res.data);
  }
  );
});

// let testDM = new cron.CronJob('00 11 20 * * *', async () => {
//   const user1 = await client.users.fetch('292409251916152832'); //Axel
//   const user2 = await client.users.fetch('557505245505257476'); //Céline
//   const user3 = await client.users.fetch('882166624717770812'); //Maxime
//   var users = [user1,user2,user3];

//   users.forEach(user => {
//     user.send("test");
//   }
//   );
// });

checkVote.start()
resultMessage.start()
sendReminderDM.start()
sendResultDM.start()
// testDM.start()

 client.login(token);