const express = require("express");
const app = express();
const queryString = require("node:querystring");
const axios = require("axios");
const CryptoJS = require("crypto-js");
const cookieParser = require('cookie-parser');
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

const nameDict = {
  "uudinn": "Axel",
  "11183209297": "Céline",
  "8oyik21m36g0xygzkhomv46ah": "Maxime",
  "312qcpi3foqze5fnflaounnkpul4": "Le goat"
}

const DBFilePath = path.join(__dirname, process.env.BDD_FILEPATH)

// Liste des noms de variables d'environnement requises
const requiredEnvVariables = ['BDD_FILEPATH', 'REDIRECT_URL', 'DISCORD_CHANNEL_ID', 'DISCORD_TOKEN', 'DELETE_SECURE_CODE', 'SPOTIFY_PLAYLIST_ID', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_CLIENT_ID'];

// Fonction de vérification des variables d'environnement
function checkEnvVariables() {
  const missingVariables = requiredEnvVariables.filter(variable => !process.env[variable]);
  if (missingVariables.length > 0) {
    console.error('Les variables d\'environnement suivantes sont manquantes :', missingVariables.join(', '));
    process.exit(1); // Arrêter le processus Node.js avec un code d'erreur
  } else {
    console.log('Toutes les variables d\'environnement sont présentes. Le serveur peut être démarré.');
  }
}

checkEnvVariables()

const clientID = process.env.SPOTIFY_CLIENT_ID
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

const base64ClientID = Buffer.from(clientID + ":" + clientSecret).toString("base64")
const redirectURI = process.env.REDIRECT_URL

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

class Track {
  constructor(id, name, artist, adder, url) {
    this.id = id;
    this.name = name;
    this.artist = artist;
    this.adder = adder;
    this.url = url;
  }
}

class User {
  constructor(id, name, vote, push_vote) {
    this.id = id;
    this.name = name;
    this.vote = vote;
    this.push_vote = push_vote;
  }
}

var accessToken = "";
var allTrack = [];
var current_user = new User("", "", 0, 0);

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
  res.sendFile(path.join(__dirname, "views/connect.html"));
});

async function addUser(userId) {

  try {
    let jsonData = await readJSON(DBFilePath); // Lire le fichier JSON existant

    if (!jsonData) {
      // Si le fichier JSON est vide ou n'existe pas, initialiser les données
      jsonData = { "users": [], "tracks": [] };
    }

    let user = jsonData["users"].find(user => user.id === userId);

    if (!user) {
      // Si l'utilisateur n'existe pas déjà, créer un nouvel utilisateur
      user = new User(userId, nameDict[userId], 0, 0);
      jsonData["users"].push(user); // Ajouter le nouvel utilisateur au tableau d'utilisateurs
    }

    await writeJSON(DBFilePath, jsonData); // Écrire les données mises à jour dans le fichier JSON

    current_user = user;
  } catch (error) {
    console.error('Une erreur s\'est produite lors de l\'ajout de l\'utilisateur :', error);
  }
}



// Utilitaire pour lire le fichier JSON
async function readJSON(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier JSON :', error);
    return null;
  }
}

// Utilitaire pour écrire le fichier JSON
async function writeJSON(filePath, jsonData) {
  try {
    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
  } catch (error) {
    console.error('Une erreur s\'est produite lors de l\'écriture dans le fichier :', error);
  }
}

async function modifyUser(user) {
  try {
    try {
      await fs.access(DBFilePath);
    } catch (error) {
      console.error('Le fichier JSON n\'existe pas.');
      return;
    }

    const jsonData = await readJSON(DBFilePath);

    // Vérifier si parseJson["users"] est défini et est un tableau
    const usersData = Array.isArray(jsonData["users"])
      ? jsonData["users"].map(user => new User(user.id, user.name, user.vote, user.push_vote))
      : [];

    // Vérifier si parseJson["tracks"] est défini et est un tableau
    const tracksData = Array.isArray(jsonData["tracks"])
      ? jsonData["tracks"].map(track => new Track(track.id, track.name, track.artist, track.adder, track.url))
      : [];

    const indexToUpdate = usersData.findIndex((item) => item.id === user.id);

    if (indexToUpdate !== -1) {
      usersData[indexToUpdate] = user;
    }

    const combineJson = { "users": usersData, "tracks": tracksData };
    await writeJSON(DBFilePath, combineJson);
  } catch (error) {
    console.error('Une erreur s\'est produite lors de la modification de l\'utilisateur :', error);
  }
}

app.get("/track_list", async (req, res) => {
  if (req.cookies.username === undefined || allTrack.length === 0) {
    return res.redirect('/');
  } else {
    res.sendFile(path.join(__dirname, "views/tracklist.html"));
  }
});

app.get('/refreshTrackList', (req, res) => {
  const spotifyURL =
    "https://accounts.spotify.com/authorize?client_id=" +
    clientID +
    "&response_type=code&redirect_uri=" +
    redirectURI +
    "&scope=" +
    scope;

  res.redirect(spotifyURL);
});

app.get("/getTrackList", async (req, res) => {
  try {
    if (req.cookies.username === undefined || allTrack.length === 0) {
      return res.redirect('/');
    }

    log(req, res, "a visité la page /track_list");

    let communHTML = ``;
    if (allTrack.length === 0) {

      if (!await fs.access(DBFilePath)) {
        await fs.writeFile(DBFilePath, '[]', 'utf8');
      }

      const jsonData = await readJSON(DBFilePath);

      // Vérifier si parseJson["tracks"] est défini et est un tableau
      const tracksData = Array.isArray(jsonData?.["tracks"])
        ? jsonData["tracks"].map(track => new Track(track.id, track.name, track.artist, track.adder, track.url))
        : [];

      allTrack = tracksData;
      showAllTrack(res, communHTML);
    } else {
      showAllTrack(res, communHTML);
    }
  } catch (error) {
    console.error('Une erreur s\'est produite dans la route "/track_list":', error);
    // Gérer l'erreur en renvoyant une réponse appropriée à l'utilisateur
    res.status(500).send('Une erreur s\'est produite. Veuillez réessayer ultérieurement.');
  }
});

async function setTrackList(all_tracks) {
  try {
    const fileExists = await fs.access(DBFilePath).then(() => true).catch(() => false);

    if (!fileExists) {
      await fs.writeFile(DBFilePath, '[]', 'utf8');
    }

    const jsonData = await fs.readFile(DBFilePath, 'utf8');
    let parseJson;

    try {
      parseJson = JSON.parse(jsonData);
    } catch (err) {
      // Si la lecture du fichier échoue ou les données ne sont pas valides JSON, on peut initialiser les valeurs par défaut
      parseJson = { "users": [], "tracks": [] };
    }

    const usersData = Array.isArray(parseJson["users"]) ? parseJson["users"].map(user => new User(user.id, user.name, user.vote, user.push_vote)) : [];
    const tracksData = Array.isArray(all_tracks) ? all_tracks.map(track => new Track(track.id, track.name, track.artist, track.adder, track.url)) : [];

    const combineJson = { "users": usersData, "tracks": tracksData };
    const updatedJsonData = JSON.stringify(combineJson, null, 2);

    await fs.writeFile(DBFilePath, updatedJsonData, 'utf8');
  } catch (err) {
    console.error('Une erreur s\'est produite lors du traitement de la route "/account":', err);
  }
}

async function saveTracks(all_tracks) {
  try {
    const jsonData = await readJSON(DBFilePath);

    // Vérifier si parseJson["users"] est défini et est un tableau
    const usersData = Array.isArray(jsonData?.["users"])
      ? jsonData["users"].map(user => new User(user.id, user.name, user.vote, user.push_vote))
      : [];

    const tracksData = all_tracks.map(track => new Track(track.id, track.name, track.artist, track.adder, track.url));

    const combineJson = { "users": usersData, "tracks": tracksData };

    await writeJSON(DBFilePath, combineJson);
    console.log('Les données ont été écrites avec succès dans le fichier JSON.');
  } catch (error) {
    console.error('Une erreur s\'est produite lors de la sauvegarde des pistes dans le fichier JSON :', error);
  }
}

function generateTrackRow(item) {
  return `<tr>
            <td>${item.name}</td>
            <td>${item.artist}</td>
            <td>${item.adder}</td>
            <td><a class="url" target="_blank" href="${item.url}">Ecouter ▶️</a></td>
          </tr>`;
}

function showAllTrack(res, communHTML) {
  if (allTrack.length > 0) {
    const tableRows = allTrack.map(generateTrackRow).join('');
    const tableHTML = `
      <div>
        <table>
          <tr>
            <th>Titre</th>
            <th>Auteur</th>
            <th>Ajoutée par</th>
            <th>Ecouter</th>
          </tr>
          ${tableRows}
        </table>
      </div>`;

    res.send(communHTML + tableHTML);
  } else {
    res.send(communHTML + "<h1>Aucun titre</h1>");
  }
}

app.get("/account", async (req, res) => {
  try {
    if (!req.query.code) {
      return res.redirect('/');
    }

    const accessToken = await getAccessToken(req.query.code, res);
    const userId = await getUserId(res, accessToken);
    addUser(userId);

    const playlistId = process.env.SPOTIFY_PLAYLIST_ID;

    const playlistTracks = await getPlaylistTracks(res, accessToken, playlistId, true);
    allTrack = playlistTracks;

    setTrackList(allTrack);

    const username = nameDict[current_user.id];
    res.cookie("username", username);
    logConnect(username);
    return res.redirect('/track_list');
  } catch (error) {
    console.error('Une erreur s\'est produite lors du traitement de la route "/account":', error);
    return res.redirect('/');
  }
});


async function isTokenValid(res, accessToken) {
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

async function getAccessToken(code, res) {
  try {
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
      throw new Error("Error: " + spotifyResponse.data.error);
    }

    return spotifyResponse.data.access_token;
  } catch (error) {
    console.error("Une erreur s'est produite lors de la récupération de l'access token:", error.message);
    res.redirect('/');
    throw error;
  }
}


async function getUserId(res, accessToken) {
  try {
    const response = await axios.get("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    });

    if (response.data.error) {
      throw new Error("Error: " + response.data.error);
    }

    return response.data.id;
  } catch (error) {
    console.error("Une erreur s'est produite lors de la récupération de l'ID de l'utilisateur:", error.message);
    res.redirect('/');
    throw error;
  }
}


async function getAllPlaylist(res, accessToken) {
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
    return res.redirect('/');
  }
  return all_playlists;
}

async function getPlaylistTracks(res, accessToken, playlist_id, setToTrack = false) {
  try {
    const response = await axios.get(
      `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,
      {
        headers: {
          Authorization: "Bearer " + accessToken,
        },
      }
    );

    if (response.data.error) {
      throw new Error("Error: " + response.data.error);
    }

    if (setToTrack) {
      const all_tracks = response.data.items.map(item => {
        const track = item.track;
        const added_by_id = item.added_by.id;
        const track_id = track.id;
        const track_name = track.name;
        const track_artist = track.artists[0].name;
        const track_adder = nameDict[added_by_id];
        const track_url = track.external_urls.spotify;
        return new Track(track_id, track_name, track_artist, track_adder, track_url);
      });

      return all_tracks;
    } else {
      return response.data;
    }
  } catch (error) {
    console.error("Une erreur s'est produite lors de la récupération des pistes de la playlist:", error.message);
    res.redirect('/');
    throw error;
  }
}

app.get("/poll", (req, res) => {
  if (req.cookies.username === undefined || allTrack.length === 0) {
    return res.redirect('/');
  }

  log(req, res, "a visité la page /poll");

  if (allTrack.length > 0) {
    const maxValue = allTrack.length - 1;
    const randomNumber = generateRandomNumber(maxValue);
    const track = allTrack[randomNumber];

    const voteText = current_user.vote === 0 ? "Tu n'as pas encore voté" : "Tu as voté, mais tu peux modifier ton vote";

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
    <p id="info-vote">${voteText}</p>
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

    function refreshBtnColor() {
      if (btnYes != null && btnNo != null) {
        if (${current_user.vote} === 1) {
          btnYes.style.backgroundColor = "#03903e";
        } else if (${current_user.vote} === -1) {
          btnNo.style.backgroundColor = "#03903e";
        }
      }
    }
    
    btnYes.addEventListener("click", refreshBtnColor);
    btnNo.addEventListener("click", refreshBtnColor);

    // Appeler refreshBtnColor une fois au chargement de la page pour définir la couleur des boutons de vote
    refreshBtnColor();
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
  return Math.round((randomNumber / (Math.pow(2, 256) - 1)) * maxValue);
}

app.get("/vote", (req, res) => {
  if (req.cookies.username === undefined || allTrack.length === 0) {
    return res.redirect('/');
  }

  log(req, res, "a voté : " + req.query.vote);

  if (req.query.vote === "yes") {
    current_user.vote = 1;
  } else if (req.query.vote === "no") {
    current_user.vote = -1;
  }

  modifyUser(current_user);

  return res.redirect("/poll");
});

app.post("/delete", async (req, res) => {
  if (req.body.code != process.env.DELETE_SECURE_CODE) {
    return res.redirect("/");
  }
  else {
    checkIfDelete();
  }
});

async function checkIfDelete() {
  try {
    const data = await fs.promises.readFile(DBPath, 'utf8');
    const parseJson = JSON.parse(data);
    const usersData = parseJson["users"].map(user => new User(user.id, user.name, user.vote, user.push_vote));
    const tracksData = parseJson["tracks"].map(track => new Track(track.id, track.name, track.artist, track.adder, track.url));

    const noVote = usersData.filter((item) => item.vote === -1).length;

    logActionBot("Nombre de vote pour la suppression : " + noVote);

    if (noVote === 2) {
      const maxValue = tracksData.length - 1;
      const randomNumber = generateRandomNumber(maxValue);
      const track = tracksData[randomNumber];

      logActionBot("Suppression de la musique : " + track.name + " par " + track.artist);
      deleteTrack(res, accessToken, playlist_id, track.id);
    }

    resetAllUsers();
    logReadBot([noVote, track.name, track.artist]);
  } catch (err) {
    console.error(err);
  }
}


async function deleteTrack(res, accessToken, playlist_id, track_id) {
  try {
    const delete_track = await axios({
      method: "delete",
      url: `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      data: {
        tracks: [{ uri: `spotify:track:${track_id}` }],
      },
    });

    if (delete_track.data.error) {
      res.send("Error: " + delete_track.data.error);
      return res.redirect('/track_list');
    }
  } catch (err) {
    console.error(err);
    res.send("Error: " + err.message);
    return res.redirect('/track_list');
  }
}

async function resetAllUsers() {
  try {
    // Vérifier si le fichier existe, sinon créer un fichier vide
    if (!fs.existsSync(DBPath)) {
      fs.writeFileSync(DBPath, JSON.stringify({ "users": [], "tracks": [] }));
    }

    // Lire le contenu du fichier JSON
    const data = fs.readFileSync(DBPath, 'utf8');
    const parseJson = JSON.parse(data);

    // Remettre à zéro les votes de tous les utilisateurs
    const usersData = parseJson["users"].map(user => {
      user.vote = 0;
      user.push_vote = 0;
      return new User(user.id, user.name, user.vote, user.push_vote);
    });

    logActionBot("Reset des votes");

    // Mettre à jour les données dans le fichier JSON
    const combineJson = { "users": usersData, "tracks": parseJson["tracks"] };
    const jsonData = JSON.stringify(combineJson, null, 2);

    // Écrire les données JSON dans le fichier
    fs.writeFileSync(DBPath, jsonData, 'utf8');

  } catch (err) {
    console.error('Une erreur s\'est produite lors de la réinitialisation des votes:', err);
  }
}

function getCurrentDateTime() {
  const date = new Date();
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} à ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

function log(info) {
  const logEntry = `${getCurrentDateTime()} => ${info}\n`;
  fs.appendFile('./views/static/log.txt', logEntry, function (err) {
    if (err) throw err;
  });
}

function logConnect(username) {
  const logEntry = `${getCurrentDateTime()} => ${username} s'est connecté avec succès\n`;
  fs.appendFile('./views/static/log.txt', logEntry, function (err) {
    if (err) throw err;
  });
}

function logReadBot(info) {
  const logEntry = `${getCurrentDateTime()} => Il y a eu ${info[0]} vote(s) pour la suppression de ${info[1]} par ${info[2]}\n`;
  fs.writeFile('./views/static/readResult.txt', logEntry, function (err) {
    if (err) throw err;
  });
}

app.get("/result", (req, res) => {
  const resultFilePath = './views/static/readResult.txt';

  if (fs.existsSync(resultFilePath)) {
    fs.readFile(resultFilePath, 'utf8')
      .then(data => res.send(data))
      .catch(err => {
        console.error(err);
        res.send("Une erreur s'est produite lors de la lecture du fichier de résultats.");
      });
  } else {
    res.send("Aucun résultat");
  }
});

function logActionBot(info) {
  const date = new Date();
  const time = date.getDate().toString() + "/" + (date.getMonth() + 1).toString() + "/" + date.getFullYear().toString() + " à " + date.getHours().toString() + ":" + date.getMinutes().toString() + ":" + date.getSeconds().toString() + " => ";
  fs.appendFile('./views/static/log.txt', time + " " + info + "\n", function (err) {
    if (err) throw err;
  }
  );
}

app.post("/test", (req, res) => {
  console.log("test");
  console.log(req.body);
  return res.redirect("/");
});

app.get("/test", (req, res) => {
  current_user.vote = 1
  modifyUser(current_user)
  return res.redirect("/");
});