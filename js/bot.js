//Discord imports
const Discord = require('discord.js');
const client = new Discord.Client({ intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildMessageReactions,
    Discord.GatewayIntentBits.MessageContent,
  ]})
const token = "MTEyODc2NjkzOTA0MTM3MDEzMg.GlZbVJ.Il5lTJxwCaqlQmIthEpoBIw3OST2pohDRAJdTY";

//Spotify/API imports
const queryString = require("node:querystring");
const axios = require("axios");

var accessToken = "";

const clientID = "41eb08913f8b43e98d5b1c498f126541";
const clientSecret = "59c9a6dfb1b24f519ecf944098a83661";

const base64ClientID = Buffer.from(clientID + ":" + clientSecret).toString("base64");
const redirectURI = "http://localhost:8080/account";

class Track {
  constructor(id, name, artist, adder) {
    this.id = id;
    this.name = name;
    this.artist = artist;
    this.adder = adder;
  }
}

const scope =
    `user-modify-playback-state
    user-read-playback-state
    user-read-currently-playing
    user-library-modify
    user-library-read
    user-top-read
    playlist-read-private
    playlist-modify-public`;


client.once('ready', () => {
    console.log("C'est tout good");
 });

 client.on('messageCreate', async message => {
    if (message.author.bot) return false;
    if (message.content === '!ping') {
        message.channel.send('Pong.');
        const spotifyResponse = await axios.post(
            "https://accounts.spotify.com/api/token",
            queryString.stringify({
              grant_type: "authorization_code",
              redirect_uri: redirectURI,
            }),
            {
              headers: {
                Authorization: "Basic " + base64ClientID,
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );
          if (spotifyResponse.data.error) {
            res.send("Error: " + spotifyResponse.data.error);
          }
          var accessToken = spotifyResponse.data.access_token;
      
          console.log(spotifyResponse.data);        message.channel.send('Pong.');
        console.log(responseGet);
    }
});

 client.on("messageCreate", message => {
    if (message.author.bot) return false;
    if (message.content === "!vote") {
      message.channel.send("Pour voter, clique sur la réaction ci-dessous !")
        .then(function (message) {
            message.react("👍")
            message.react("👎")
            }
        )
    }
  })

 client.login(token);