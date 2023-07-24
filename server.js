const express = require("express");
const app = express();
const queryString = require("node:querystring");
const axios = require("axios");
const CryptoJS = require("crypto-js");
var cookieParser = require('cookie-parser');  

const fs = require("fs");

const nameDict = {
  "uudinn": "Axel",
  "11183209297": "Céline",
  "8oyik21m36g0xygzkhomv46ah": "Maxime",
  "312qcpi3foqze5fnflaounnkpul4": "Le goat"
}

const clientID = "41eb08913f8b43e98d5b1c498f126541";
const clientSecret = "59c9a6dfb1b24f519ecf944098a83661";

const base64ClientID = Buffer.from(clientID + ":" + clientSecret).toString("base64");
//const redirectURI = "http://localhost:1443/account";
const redirectURI = "http://mennessi.iiens.net/account";

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
var current_user = new User("",0,0);

app.listen(1443, () => {
  console.log("App is listening on port 1443! localhost:1443\n");
});

app.use(express.json());
app.use(cookieParser());   
app.use("/static", express.static('./views/static/'));

// #region Get Authorization and Add Users

//this page contains the link to the spotify authorization page
//contains custom url queries that pertain to my specific app
app.get("/", async (req, res) => {
  res.sendFile(path+"connect.html");
  //res.redirect("/track_list");

});

function addUser(userId) {
  var jsonData = [];
  var user = new User(userId,0,0);
  if ( !fs.existsSync('./views/static/fichier.json')) { fs.writeFile(filePath, jsonData, 'utf8', () => {}) }
  fs.readFile('./views/static/fichier.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    parseJson = JSON.parse(data);
    var usersData = parseJson["users"].map(user => new User(user.id,user.vote,user.push_vote));
    var tracksData = parseJson["tracks"].map(track => new Track(track.id,track.name,track.artist,track.adder,track.url));

    already_known = false;
    usersData.forEach(user => {
      if (user.id == userId) {
        already_known = true;
      }
    });
    if (!already_known) {
      usersData.push(new User(userId,0,0));
    }
    else {
      user = usersData.filter((item) => item.id === userId)[0];
    }
    combineJson = {"users":usersData,"tracks":tracksData}
    jsonData = JSON.stringify(combineJson, null, 2);
  
    // Chemin du fichier où nous voulons écrire les données JSON
    const filePath = './views/static/fichier.json';
  
    // Écrire les données JSON dans le fichier
    fs.writeFile(filePath, jsonData, 'utf8', (err) => {
      if (err) {
        console.error('Une erreur s\'est produite lors de l\'écriture dans le fichier:', err);
      } else {
        //console.log('Les données ont été écrites avec succès dans le fichier JSON.');
      }
    });
    current_user = user;
  });
}

function modifyUser(user) {
  var jsonData = [];
  if ( !fs.existsSync('./views/static/fichier.json')) { fs.writeFile(filePath, jsonData, 'utf8', () => {}) }
  fs.readFile('./views/static/fichier.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    parseJson = JSON.parse(data);
    var usersData = parseJson["users"].map(user => new User(user.id,user.vote,user.push_vote));
    var tracksData = parseJson["tracks"].map(track => new Track(track.id,track.name,track.artist,track.adder,track.url));

    const indexToUpdate = usersData.findIndex((item) => item.id === user.id);

    if (indexToUpdate !== -1) {
      usersData[indexToUpdate] = user;
    }
    combineJson = {"users":usersData,"tracks":tracksData}
    jsonData = JSON.stringify(combineJson, null, 2);

    // Chemin du fichier où nous voulons écrire les données JSON
    const filePath = './views/static/fichier.json';
  
    // Écrire les données JSON dans le fichier
    fs.writeFile(filePath, jsonData, 'utf8', (err) => {
      if (err) {
        console.error('Une erreur s\'est produite lors de l\'écriture dans le fichier:', err);
      } else {
        //console.log('Les données ont été écrites avec succès dans le fichier JSON.');
      }
    });
  });
}

// #endregion

// #region Affichage track list and Add Track

app.get("/track_list", (req, res) => {
  const date = new Date();
  console.log(date.getDate().toString()+"/"+date.getMonth().toString()+"/"+date.getFullYear().toString()+" à "+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()+" => "+req.cookies["username"]+ " a visité la page /track_list");
  let communHTML = `
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
      .url {
        text-decoration: none;
        color: #00A6ED;
        border: 1px solid #00A6ED;
        border-radius: 5px;
        padding: 2px;
        background-color: #ffffff99;
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
        font-family:  Verdana, sans-serif, Helvetica, Arial;
      }
      h1 {
        padding: 8px;
        text-align: center;
        vertical-align: middle;
        font-family:  Verdana, sans-serif, Helvetica, Arial;
        font-size: 30px ;
        font-weight: 600 ;
        text-transform: uppercase;
        -webkit-text-stroke-width: 2px;
        -webkit-text-stroke-color: black;
        color: white;
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
    </div>`;
  if (allTrack.length == 0) {
    var jsonData = [];
    if ( !fs.existsSync('./views/static/fichier.json')) { fs.writeFile(filePath, jsonData, 'utf8', () => {}) }
    fs.readFile('./views/static/fichier.json', 'utf8', (err, data) => {
      if (err) {
        console.error(err)
        return
      }
      parseJson = JSON.parse(data);
      var usersData = parseJson["users"].map(user => new User(user.id,user.vote,user.push_vote));
      var tracksData = parseJson["tracks"].map(track => new Track(track.id,track.name,track.artist,track.adder,track.url));
      
      allTrack = tracksData;
      showAllTrack(res, communHTML);
    });
  }
  else {
    showAllTrack(res,communHTML);
  }
});

function setTrackList(all_tracks) {
  var jsonData = [];
  if ( !fs.existsSync('./views/static/fichier.json')) { fs.writeFile(filePath, jsonData, 'utf8', () => {}) }
  fs.readFile('./views/static/fichier.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    parseJson = JSON.parse(data);
    var usersData = parseJson["users"].map(user => new User(user.id,user.vote,user.push_vote));
    var tracksData = [];

    allTrack.forEach(track => {
      tracksData.push(new Track(track.id,track.name,track.artist,track.adder,track.url));
    });
    combineJson = {"users":usersData,"tracks":tracksData}
    jsonData = JSON.stringify(combineJson, null, 2);
  
    // Chemin du fichier où nous voulons écrire les données JSON
    const filePath = './views/static/fichier.json';
  
    // Écrire les données JSON dans le fichier
    fs.writeFile(filePath, jsonData, 'utf8', (err) => {
      if (err) {
        console.error('Une erreur s\'est produite lors de l\'écriture dans le fichier:', err);
      } else {
        //console.log('Les données ont été écrites avec succès dans le fichier JSON.');
      }
    });
  });
}

function showAllTrack(res,communHTML) {
  if (allTrack.length > 0) {
    let tableHTML = `
      <div>
        <table>
          <tr>
            <th>Titre</th>
            <th>Auteur</th>
            <th>Ajoutée par</th>
            <th>Ecouter</th>
          </tr>
    `;

    allTrack.forEach(item => {
      tableHTML += `<tr><td>${item.name}</td><td>${item.artist}</td><td>${item.adder}</td><td><a class="url" target="_blank" href="${item.url}">Ecouter ▶️</a></td></tr>`;
    });

    tableHTML += '</div> </table>';
    res.send(communHTML+tableHTML);
  }
  else {
    res.send(communHTML + "<h1>Aucun titre</h1>");
  }
}

// #endregion

// #region Get tracks from Spotify

//this is the page user is redirected to after accepting data use on spotify's website
//it does not have to be /account, it can be whatever page you want it to be
app.get("/account", async (req, res) => {
    const accessToken = await getAccessToken(req.query.code, res);
    const userId = await getUserId(res,accessToken);
    addUser(userId);

    // all_playlists = await getAllPlaylist(res, accessToken);
    // const playlist_id = all_playlists.data["items"].filter((item) => item.name === "WtfCanadianTapeN°001")[0]["id"]; 

    const playlist_id = "0zwxvVl7yOd2qeb3tQgd5Q"

    playlist_tracks = await getPlaylistTracks(res,accessToken,playlist_id,setToTrack=true); // setToTrack=true to get the tracks as Track objects
    allTrack = playlist_tracks;

    setTrackList(allTrack);

    // console.log(playlist_tracks);
    const track_to_delete = playlist_tracks.filter((item) => item.name === "Hello (feat. A Boogie Wit da Hoodie)");
    
    // var track_id = track_to_delete[0]["id"];
    // await deleteTrack(res,accessToken,playlist_id,track_id);
    res.cookie("username", nameDict[current_user.id]);
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

async function getUserId(res,accessToken) {
  const userid = await axios.get(
    "https://api.spotify.com/v1/me",
    {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    }
  );

  if (userid.data.error) {
    res.send("Error: " + userid.data.error);
    res.redirect('/');
  }
  return userid.data["id"];
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

// #endregion

// #region Poll

app.get("/poll", (req, res) => {
  if (allTrack.length > 0) {
    const maxValue = allTrack.length - 1;
    const randomNumber = generateRandomNumber(maxValue);
    const track = allTrack[randomNumber];
    res.send(`<style>
      $fontStack: Verdana, sans-serif, Helvetica, Arial
      $primaryColor: #00db7f
      $primaryBoldColor: #03903e
      html, body {
        width: 100%;
        height: 100%;
      }
      
      body {
        width: 100%;
        min-height: 100vh;
        margin: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
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
      
      #container {
        perspective: 25px;
        display: grid;
        grid-template-rows: 1fr 1fr;
      }
      
      .beatiful-card {
        display: flex;
        width: 400px;
        height: 185px;
        position: relative;
        border-radius: 20px;
        background: #fff;
        transition: transform 0.5s;
        -webkit-transition: transform 0.5s;
        box-shadow: 0 30px 35px -14px rgba(111, 208, 50, 0.58);
      }
      .beatiful-card:after, .beatiful-card:before {
        content: " ";
        position: absolute;
        bottom: -13px;
        left: 10px;
        right: 10px;
        margin: 0 5px;
        background: #b8bd8d4f;
        z-index: -3;
        height: 13px;
        transition: bottom ease 0.1s;
        border-bottom-left-radius: 14px;
        border-bottom-right-radius: 14px;
      }
      .beatiful-card:after {
        background: rgba(184, 189, 141, 0.25);
        height: 21px;
        bottom: -22px;
        right: 25px;
        left: 25px;
      }
      .beatiful-card:hover:before {
        bottom: -13px;
      }
      .beatiful-card:hover:after {
        bottom: -22px;
      }
      .beatiful-card:hover img {
        transform: scale(1.06);
      }
      .beatiful-card .holderPart {
        display: flex;
        width: 100%;
        flex-wrap: wrap;
      }
      .beatiful-card .holderPart .title, .beatiful-card .holderPart .subtitle {
        font-size: 22px;
        padding: 0 16px;
        position: relative;
        font-family: Verdana, sans-serif, Helvetica, Arial;
        display: flex;
        z-index: 5;
        width: 88%;
        overflow-x: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        transition: transform 0.4s ease, filter 0.4s ease, -webkit-transform 0.4s ease, -webkit-filter 0.4s ease;
        justify-content: flex-start;
        margin: 10px 0px 0px 0px;
      }
      .beatiful-card .holderPart .subtitle {
        margin: 0px 0px 15px 0px;
      }
      .beatiful-card .holderPart #YesVote, .beatiful-card .holderPart #NoVote {
        color: #fff;
        padding: 8px 11px 12px 22px;
        margin: 0px 7%;
        background: #00db7f;
        border-radius: 20px;
        font-family: Verdana, sans-serif, Helvetica, Arial;
        cursor: pointer;
        box-shadow: 0 6px 14px -4px rgba(54, 55, 149, 0.42);
        position: relative;
        width: 27%;
        top: -15px;
        display: flex;
        align-items: center;
      }
      .beatiful-card .holderPart #YesVote:hover, .beatiful-card .holderPart #NoVote:hover {
        background: #03903e;
      }
      .beatiful-card .holderPart #YesVote:hover i, .beatiful-card .holderPart #NoVote:hover i {
        transform: scale(1.08);
      }
      .beatiful-card .holderPart #YesVote i, .beatiful-card .holderPart #NoVote i {
        background: rgba(0, 0, 0, 0.5);
        font-family: Verdana, sans-serif, Helvetica, Arial;
        padding: 6px 6px;
        left: 50px;
        border-radius: 100%;
        position: relative;
        transition: transform ease-in-out 0.3s;
        top: 2px;
        font-style: normal;
      }
      .beatiful-card .holderPart .adder {
        height: 10px;
        font-family: Verdana, sans-serif, Helvetica, Arial;
        font-size: 14px;
        z-index: 1;
        width: 42%;
        top: -12%;
        left: 5%;
        position: relative;
        margin: 15px 0px 20px 0px;
      }
      .beatiful-card .holderPart .link {
        height: 10px;
        font-family: Verdana, sans-serif, Helvetica, Arial;
        font-size: 14px;
        z-index: 1;
        width: 42%;
        top: -12%;
        left: 32%;
        position: relative;
        margin: 15px 0px 20px 0px;
      }
      .beatiful-card .holderPart .link .url {
        text-decoration: none;
        color: #00A6ED;
        border: 1px solid #00A6ED;
        border-radius: 5px;
        padding: 2px;
        background-color: #ffffff99;
      }
      .yesno {
        font-family: Verdana, sans-serif, Helvetica, Arial;
        display: block;
        width: 10px;
        margin: 0;
        position: relative;
      }
      .icon {
        font-family: Verdana, sans-serif, Helvetica, Arial;
        position: relative;
        margin: 0;
        font-size: 20px;
        top: -2px;
      }
      #Info {
        width: 100%;
        height: 100px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        position: relative;
        top: -25%;
        color: #fff;
      }
      #info-title {
        font-size: 30px;
        font-weight: 600;
        text-transform: uppercase;
      }
      #info-desc {
        font-size: 20px;
        font-weight: 400;
        margin: 0;
        padding: 0;
      }
      #info-vote {
        font-size: 20px;
        font-weight: 400;
        margin: 0;
        padding: 0;
      }
    </style>

    <div id="btns" style="text-align: center;">
      <a id="refresh" href='/track_list'>Retour</a>
    </div>

    <div id="Info">
      <h1 id="info-title">Sondage du jour</h1>
      <p id="info-desc">${req.cookies["username"]}, tu as jusqu'à 23h59 pour voter sur le maintien de la musique dans la playlist. (UTC+2, Paris)</p>
      <p id="info-vote">${current_user.vote == 0?"Tu n'as pas encore voté":"Tu as voté, mais tu peux modifier ton vote"}</p>
    </div>

    <div id="container">
      <div class="beatiful-card">
        <div class="holderPart">
          <h3 class="title">${track.name}</h3>
          <h4 class="subtitle">par ${track.artist}</h4>
          <p class="adder">Ajoutée par ${track.adder}</p>
          <p class="link"><a class="url" target="_blank" href="${track.url}">Ecouter ▶️</a></p>
          <div id="YesVote" onclick="location.href='/vote?vote=yes';">
            <p class="yesno">Oui</p>
            <i class="zmdi zmdi-favorite">
              <p class="icon">👍</p>
            </i>
          </div>
          <div id="NoVote"  onclick="location.href='/vote?vote=no';">            
            <p class="yesno">Non</p>
            <i class="zmdi zmdi-favorite">
              <p class="icon">👎</p>
            </i>
          </div>
        </div>
      </div>
    </div>

    <script>
    var btnYes = document.getElementById("YesVote");
    var btnNo = document.getElementById("NoVote");
    refreshBtnColor();
    function refreshBtnColor() {
      var btnYes = document.getElementById("YesVote");
      var btnNo = document.getElementById("NoVote");
      if (btnYes != null && btnNo != null) {
        if (${current_user.vote} == 1) {
          btnYes.style.backgroundColor = "#03903e";
        }
        else if (${current_user.vote} == -1) {
          btnNo.style.backgroundColor = "#03903e";
        }
      }
    }
    
    btnYes.addEventListener("click", refreshBtnColor());
    btnNo.addEventListener("click", refreshBtnColor());
    </script>
    `);
  }
});

function generateRandomNumber(maxValue) {
  const date = new Date();
  // Obtenir le jour de la date (1 à 31)
  const day = date.getDate();

  // Convertir la date en une chaîne de caractères au format "YYYY-MM-DD"
  const dateString = date.toISOString().slice(0, 10);

  // Concaténer le jour à la date
  const dataToHash = dateString + day;

  // Calculer le hachage SHA-256
  const hash = CryptoJS.SHA256(dataToHash);

  // Convertir le hachage en un nombre décimal
  const randomNumber = parseInt(hash.toString(), 16);

  // Renvoyer un nombre aléatoire entre 0 et 1 pour le jour donné
  return Math.round((randomNumber / (Math.pow(2, 256) - 1))*maxValue);
}

app.get("/vote", (req, res) => {
  console.log(req.cookies["username"]+" : "+req.query.vote);
  if (req.query.vote == "yes") {
    current_user.vote = 1;
  }
  else if (req.query.vote == "no") {
    current_user.vote = -1;
  }
  modifyUser(current_user);
  res.redirect("/poll");
});  

// #endregion

// #region Delete Track and Reset Users

app.post("/delete", (req, res) => {
  if (req.body.code != "iziLeCodeDuBot")
  {
    res.redirect("/");
  }
  else {
    checkIfDelete();
    res.redirect("/");
  }
});

async function checkIfDelete() 
{
  var jsonData = [];
  if ( !fs.existsSync('./views/static/fichier.json')) { fs.writeFile(filePath, jsonData, 'utf8', () => {}) }
  fs.readFile('./views/static/fichier.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    parseJson = JSON.parse(data);
    var usersData = parseJson["users"].map(user => new User(user.id,user.vote,user.push_vote));
    var tracksData = parseJson["tracks"].map(track => new Track(track.id,track.name,track.artist,track.adder,track.url));

    const maxValue = tracksData.length - 1;
    const randomNumber = generateRandomNumber(maxValue);
    const track = tracksData[randomNumber];

    var noVote = usersData.filter((item) => item.vote === -1).length;
  
    console.log("noVote : "+ noVote);

    if (noVote === 2) {
      deleteTrack(res,accessToken,playlist_id,track.id);
    }
    resetAllUsers();
  });
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

function resetAllUsers()
{
  var jsonData = [];
  if ( !fs.existsSync('./views/static/fichier.json')) { fs.writeFile(filePath, jsonData, 'utf8', () => {}) }
  fs.readFile('./views/static/fichier.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    parseJson = JSON.parse(data);
    var usersData = parseJson["users"].map(user => new User(user.id,user.vote,user.push_vote));
    var tracksData = parseJson["tracks"].map(track => new Track(track.id,track.name,track.artist,track.adder,track.url));

    usersData.forEach(user => {
      user.vote = 0;
      user.push_vote = 0;
    });

    const date = new Date();
    console.log(date.getDate().toString()+"/"+date.getMonth().toString()+"/"+date.getFullYear().toString()+" à "+date.getHours().toString()+":"+date.getMinutes().toString()+":"+date.getSeconds().toString()+" => Users reset");
  
    combineJson = {"users":usersData,"tracks":tracksData}
    jsonData = JSON.stringify(combineJson, null, 2);

    // Chemin du fichier où nous voulons écrire les données JSON
    const filePath = './views/static/fichier.json';
  
    // Écrire les données JSON dans le fichier
    fs.writeFile(filePath, jsonData, 'utf8', (err) => {
      if (err) {
        console.error('Une erreur s\'est produite lors de l\'écriture dans le fichier:', err);
      } else {
        //console.log('Les données ont été écrites avec succès dans le fichier JSON.');
      }
    });
  });
}

// #endregion

app.post("/test", (req, res) => {
  console.log("test"); 
  console.log(req.body);
  res.redirect("/");
});