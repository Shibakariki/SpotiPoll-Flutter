const express = require("express");
const app = express();
const queryString = require("node:querystring");
const axios = require("axios");
const { get } = require("node:http");

const fs = require("fs");

const nameDict = {
  "uudinn": "Axel",
  "11183209297": "Céline",
  "8oyik21m36g0xygzkhomv46ah": "Maxime"
}

const clientID = "41eb08913f8b43e98d5b1c498f126541";
const clientSecret = "59c9a6dfb1b24f519ecf944098a83661";

const base64ClientID = Buffer.from(clientID + ":" + clientSecret).toString("base64");
const redirectURI = "http://localhost:1443/account";
// const redirectURI = "http://mennessi.iiens.net/account";

const scope =
    `user-modify-playback-state
    user-read-playback-state
    user-read-currently-playing
    user-library-modify
    user-library-read
    user-top-read
    playlist-read-private
    playlist-modify-public`;

var router = express.Router();
var path = __dirname + '/views/'; // this folder should contain your html files.

class Track {
  constructor(id, name, artist, adder,url) {
    this.id = id;
    this.name = name;
    this.artist = artist;
    this.adder = adder;
    this.url = url;
  }  
}  

class User {
  constructor(id,vote,push_vote) {
    this.id = id;
    this.vote = vote;
    this.push_vote = push_vote;
  }
}

var accessToken = "";
var allTrack = [];

app.listen(1443, () => {
  console.log("App is listening on port 1443! localhost:1443\n");
});

app.use("/static", express.static('./views/static/'));

//this page contains the link to the spotify authorization page
//contains custom url queries that pertain to my specific app
app.get("/", async (req, res) => {
  res.sendFile(path+"connect.html");
  //res.redirect("/track_list");
});

function testbdd() {
  var userData = [];
  if ( fs.existsSync('./views/static/fichier.json')) {
    fs.readFile('./views/static/fichier.json', 'utf8', (err, data) => {
      if (err) {
        console.error(err)
        return
      }
      parseJson = JSON.parse(data);
      parseJson.forEach(user => {
        userData.push(new User(user.id, user.vote, user.push_vote));
      });

      addUser(userData,"111","0","0");

    });
  }
  else {
    console.log("Le fichier n'existe pas");
    addUser(userData,"111","0","0");
  }
}

function addUser(userData,id,vote,push_vote) {
  userData.push(new User(id,vote,push_vote));
  jsonData = JSON.stringify(userData, null, 2);

  // Chemin du fichier où nous voulons écrire les données JSON
  const filePath = './views/static/fichier.json';

  // Écrire les données JSON dans le fichier
  fs.writeFile(filePath, jsonData, 'utf8', (err) => {
    if (err) {
      console.error('Une erreur s\'est produite lors de l\'écriture dans le fichier:', err);
    } else {
      console.log('Les données ont été écrites avec succès dans le fichier JSON.');
    }
  });
}

function addTrackList(all_tracks) {
  jsonData = JSON.stringify(all_tracks, null, 2);

  // Chemin du fichier où nous voulons écrire les données JSON
  const filePath = './views/static/fichier.json';

  // Écrire les données JSON dans le fichier
  fs.writeFile(filePath, jsonData, 'utf8', (err) => {
    if (err) {
      console.error('Une erreur s\'est produite lors de l\'écriture dans le fichier:', err);
    } else {
      console.log('Les données ont été écrites avec succès dans le fichier JSON.');
    }
  });
}


app.get("/poll", (req, res) => {
  if (allTrack.length > 0) {
    const maxValue = allTrack.length - 1;
    const randomNumber = generateRandomNumber(maxValue);
    console.log(randomNumber);
    const track = allTrack[randomNumber];
    console.log(track);
    res.send("noice")
  }
});

app.get("/track_list", (req, res) => {
  if (allTrack.length > 0) {
    let tableHTML = `
      <style>
        body {
          background: linear-gradient(95deg, #00db7f 0%,#1DB954 40%,#03903e 100%);
          margin: 0;
          padding: 0;
          font-family: Verdana, sans-serif, Helvetica, Arial;
        }
        #btns{
          text-align: center;
          display: block;
          margin: 1%;
        }
        #sondage {
          background-color: #696969;
          border: none;
          color: #FFFFFF;
          cursor: pointer;
          font-size: 17px;
          font-weight: 700;
          font-family: Verdana, sans-serif, Helvetica, Arial;
          line-height: 41px;
          padding: 15px 40px;
          text-align: center;
          text-decoration: none;
          text-transform: uppercase;
          white-space: nowrap;
          } 
        #sondage:hover {
          background-color: #03903e;
          transition: ease-in-out 0.5s;
        }
        #refresh {
          background-color: #696969;
          border: none;
          color: #FFFFFF;
          cursor: pointer;
          font-size: 17px;
          font-weight: 700;
          font-family: Verdana, sans-serif, Helvetica, Arial;
          line-height: 41px;
          padding: 15px 40px;
          text-align: center;
          text-decoration: none;
          text-transform: uppercase;
          white-space: nowrap;
          }
        #refresh:hover {
          background-color: #EE4B2B;
          transition: ease-in-out 0.5s;
        }
        table {
          margin: 0 auto;
          text-align: left;
          color: white;
          cursor: default;
          border-spacing: 0;
          border-collapse: collapse;
          width: 80%;
          font-family: Verdana, sans-serif, Helvetica, Arial;
        }
        th, td {
          padding: 8px;
          text-align: center;
          vertical-align: middle;
        }
        th {
          background-color: #ffffff44;
        }
        tr:nth-child(even) {
          background-color: #ffffff24;
        }
        tr:nth-child(odd) {
          background-color: #ffffff11;
        }
        td:hover {
          background-color: #ffffff44;
        }
      </style>
      <div id="btns" style="text-align: center;">
        <a id="sondage" href="/poll">Sondage du jour</a>
        <a id="refresh" href='https://accounts.spotify.com/authorize?client_id=${clientID}&response_type=code&redirect_uri=${redirectURI}&scope=${scope}'>Refresh</a>
      </div>
      <div>
        <table>
          <tr>
            <th>Titre</th>
            <th>Auteur</th>
            <th>Ajouté par</th>
            <th>Supprimer</th>
          </tr>
    `;

    allTrack.forEach(item => {
      tableHTML += `<tr><td>${item.name}</td><td>${item.artist}</td><td>${item.adder}</td><td><a href="${item.url}">Ecouter</a></td></tr>`;
    });

    tableHTML += '</div> </table>';
    res.send(tableHTML);
  }
});

//this is the page user is redirected to after accepting data use on spotify's website
//it does not have to be /account, it can be whatever page you want it to be
app.get("/account", async (req, res) => {
    const accessToken = await getAccessToken(req.query.code, res);

    // all_playlists = await getAllPlaylist(res, accessToken);
    // const playlist_id = all_playlists.data["items"].filter((item) => item.name === "WtfCanadianTapeN°001")[0]["id"]; 

    const playlist_id = "0zwxvVl7yOd2qeb3tQgd5Q"

    playlist_tracks = await getPlaylistTracks(res,accessToken,playlist_id,setToTrack=true); // setToTrack=true to get the tracks as Track objects
    allTrack = playlist_tracks;

    addTrackList(allTrack);

    // console.log(playlist_tracks);
    const track_to_delete = playlist_tracks.filter((item) => item.name === "Hello (feat. A Boogie Wit da Hoodie)");
    
    // var track_id = track_to_delete[0]["id"];
    // await deleteTrack(res,accessToken,playlist_id,track_id);
    console.log("the end");
    res.redirect('/track_list');
})

async function isTokenValid(res,accessToken) {
  const token_valid = await axios.get(
    "https://api.spotify.com/v1/artists/0TnOYISbd1XYRBk9myaseg",
    {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    }
  );

  if (token_valid.data.error) {
    return false;
  }
  return true;
}

async function getAccessToken(code,res) {
  const spotifyResponse = await axios.post(
    "https://accounts.spotify.com/api/token",
    queryString.stringify({
      grant_type: "authorization_code",
      code: code,
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
    res.redirect('/');
  }
  var accessToken = spotifyResponse.data.access_token;
  return accessToken;
}

async function getAllPlaylist(res,accessToken) {
  const all_playlists = await axios.get(
    "https://api.spotify.com/v1/me/playlists",
    {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    }
  );

  if (all_playlists.data.error) {
    res.send("Error: " + all_playlists.data.error);
    res.redirect('/');
  }
  return all_playlists;
}

async function getPlaylistTracks(res,accessToken,playlist_id,setToTrack=false) {
  const playlist_tracks = await axios.get(
    "https://api.spotify.com/v1/playlists/"+playlist_id+"/tracks",
    {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    }
  );

  if (playlist_tracks.data.error) {
    res.send("Error: " + playlist_tracks.data.error);
    res.redirect('/');
  }
  if (setToTrack) {
    var all_tracks = playlist_tracks.data["items"];
    all_tracks = all_tracks.map((item) => new Track(item["track"]["id"], item["track"]["name"], item["track"]["artists"][0]["name"], nameDict[item["added_by"]["id"]],item["track"]["external_urls"]["spotify"]));
    return all_tracks;
  }
  else {
    return playlist_tracks;
  }
}

async function deleteTrack(res,accessToken,playlist_id,track_id) {
  const delete_track = await axios.delete(
  "https://api.spotify.com/v1/playlists/"+playlist_id+"/tracks",
  {
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json"
    },
    data: {
      tracks: [
        {
          uri: "spotify:track:"+track_id
        }
      ]
    }
  }
  );

  if (delete_track.data.error) {
  res.send("Error: " + delete_track.data.error);
  res.redirect('/track_list');
  }
}

function generateRandomNumber(maxValue) {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Combinez les parties de la date pour obtenir une chaîne unique qui changera chaque jour
  const dateString = `${year}-${month}-${day}`;

  // Utilisez la chaîne de date comme graine (seed) pour générer un nombre aléatoire
  const seed = parseInt(dateString, 36);
  const random = (seed * 9301 + 49297) % 233280;

  // Normalisez le nombre aléatoire entre 0 et maxValue
  return Math.floor((random / 233280) * (maxValue + 1));
}