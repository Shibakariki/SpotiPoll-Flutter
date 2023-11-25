
require("dotenv").config();
//Discord imports
const Discord = require("discord.js");
const axios = require("axios");
const cron = require("cron");

const client = new Discord.Client({ intents: [
      Discord.GatewayIntentBits.Guilds,
      Discord.GatewayIntentBits.GuildMessages,
      Discord.GatewayIntentBits.GuildMessageReactions,
      Discord.GatewayIntentBits.MessageContent,
  ], disableEveryone: false})

const token = "MTE3Mjg1NTExMDIzMDA4NTcyMg.Ge0oG0.oh89w25mr8Fdc4KYZf_DpXBVnT87Ar0fg41nqQ"
const resultURI = process.env.RESULT_URL
const votedURI = process.env.VOTED_URL
const trackURI = process.env.TRACK_URL
const code = process.env.DELETE_SECURE_CODE
const discord_users_ids = process.env.DISCORD_USER_IDS.split(" ");

client.once("ready", () => {
  console.log("C'est tout good");
});

// Message de résultat
new cron.CronJob("00 00 00 * * *", async () => {
const res = await axios.post(resultURI, {key: code});
console.log(res.data);
const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
channel.send(res.data);
}).start();

// Reminder
new cron.CronJob("00 00 22 * * *", async () => {
  const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
  let reminderMsg = await defineMsg();
  channel.send(reminderMsg);
  }).start();

// DM Reminders
async function sendDM(){
  var discordIdToFetch = [];

  let reminderMsg = await defineMsg();

  let spotiPollUsersWithMissedVote = await axios.post(votedURI, {key: code});

  for (const discordUser of discord_users_ids) {
    spotify_id = discordUser.split(".")[0];
    discord_id = discordUser.split(".")[1];
    if (spotiPollUsersWithMissedVote.data.includes(spotify_id) && discord_id == "292409251916152832") {
      discordIdToFetch.push(discord_id);
    }
  }

  for (const discordId of discordIdToFetch) {
    const user = await client.users.fetch(discordId);
    user.send(reminderMsg);
  }
}

async function defineMsg(isDM = true){
  const res = await axios.post(trackURI, {key: code});
  let reminderMsg = "";
  if (isDM) {
    reminderMsg = "Tu n'as pas encore voté, n'oublie pas !";
  }
  else{
    reminderMsg = "@everyone Dernier rappel pour voter !";
  }
  if (res != null){
    track = res.data;
    reminderMsg += " Le vote se cloture à 23h59 \n Le vote est sur le titre "+track.name+" de "+track.artist+"\n https://mennessi.iiens.net/vote";
  }
  else{
    reminderMsg += " Le vote se cloture à 23h59 \n https://mennessi.iiens.net/vote";
  }
  return reminderMsg;
}

  // Envoie de DM à tous les utilisateurs n"ayant pas voté
new cron.CronJob("00 00 16 * * *", async () => {
  // new cron.CronJob("00 45 11 * * *", async () => {
    //Send DM to a user with is id
    sendDM();
}).start();

 client.login(token);