import express from "express";
import axios from "axios";
import CryptoJS from "crypto-js";
import cookieParser from "cookie-parser";
import {config as configDotenv} from "dotenv";

import Database from './database.js';
import Spotify from './spotify.js';

import path, {dirname} from "path";
import {fileURLToPath} from 'url';

import eventsource from 'eventsource';

const app = express();

configDotenv();

global.EventSource = eventsource;

const nameDict = {
    "uudinn": "Axel",
    "11183209297": "Céline",
    "8oyik21m36g0xygzkhomv46ah": "Maxime",
    "312qcpi3foqze5fnflaounnkpul4": "Le goat"
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Liste des noms de variables d'environnement requises
const requiredEnvVariables = ['REDIRECT_URL', 'DISCORD_CHANNEL_ID', 'DISCORD_TOKEN', 'DELETE_SECURE_CODE', 'SPOTIFY_PLAYLIST_NAME', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_CLIENT_ID', 'PB_USERNAME', 'PB_PASSWORD'];

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

const scope = `user-modify-playback-state
    user-read-playback-state
    user-read-currently-playing
    user-library-modify
    user-library-read
    user-top-read
    playlist-read-private
    playlist-modify-public`;

const database = new Database();
const spotify = new Spotify(process.env.REDIRECT_URL, process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET)
app.listen(1443, () => {
    console.log("App is listening on port 1443! localhost:1443\n");
});

app.use(express.json());
app.use(cookieParser());
app.use("/static", express.static('./views/static/'));

app.get("/", async (req, res) => {
    // Si on a un token pour appeler l'API Spotify, on redirige vers la page /track_list
    if (spotify.isTokenSet()) {
        return res.redirect('/track_list');
    } else {
    // Sinon, on utilise le compte du premier utilisateur pour générer le token
        return res.sendFile(path.join(__dirname, "views/connect.html"));
    }
});

// #region Gestion des Tracks
app.get("/track_list", async (req, res) => {
    if (!spotify.isTokenSet()) {
        return res.redirect('/');
    } else {
        return res.sendFile(path.join(__dirname, "views/tracklist.html"));
    }
});

app.get('/authSpotify', async (req, res) => {
    const spotifyURL = "https://accounts.spotify.com/authorize?client_id=" + process.env.SPOTIFY_CLIENT_ID + "&response_type=code&redirect_uri=" + process.env.REDIRECT_URL + "&scope=" + scope;
    return res.redirect(spotifyURL);
});

app.get('/refreshTrackList', async (req, res) => {
    if (!spotify.isTokenSet()) {
        return res.redirect('/');
    } else {
        try {
            refreshTrackList();
            return res.redirect('/track_list');
        } catch (error) {
            console.error('Une erreur s\'est produite lors de la récupération des pistes :', error);
            return res.redirect('/track_list');
        }
    }
});

app.get("/getTrackList", async (req, res) => {
    log("VISIT", req.cookies.username + " a visité la page /track_list");
    let communHTML = ``;
    const allTrack = await database.getTrackList();
    return showAllTrack(res, allTrack, communHTML); //gère le 0 tracks et return un html
});

// TODO : Supprimer de la base les musiques qui ne sont pas dans la playlist Spotify
async function saveTrackList(all_tracks) {
  try {
      // Pour chaque piste, on vérifie si elle existe déjà dans la base de données
      let dbTrackList = await database.getTrackList();

      // Filtrer les pistes qui n'existent pas encore dans la base de données
      let newTracks = all_tracks.filter(
          track => !dbTrackList.some(dbTrack => dbTrack.id_track === track.id_track)
      );

      for (const track of newTracks) {
          await database.addTrack(track);
      }
  } catch (error) {
    console.error('Une erreur s\'est produite lors de la sauvegarde des pistes dans la base de données :', error);
    throw error;
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

function showAllTrack(res, allTrack, communHTML) {
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

        return res.send(communHTML + tableHTML);
    } else {
        return res.send(communHTML + "<h1>Aucun titre</h1>");
    }
}

// #endregion

// #region Connexion Spotify

/* On recoit le retour de la demande d'autorisation d'accès de Spotify ici */
app.get("/account", async (req, res) => {
    try {
        // Si quelqu'un d'autre essaie d'accéder à cette page, on le redirige vers la page d'accueil
        if (!req.query.code) {
            return res.redirect('/');
        }

        // On enregistre les tokens
        await spotify.getAccessToken(req.query.code)
        await refreshTrackList()

        log("INIT", "Initialisation effectuée par " + req.cookies.username)
        return res.redirect('/track_list');

    } catch (error) {
        console.error('Une erreur s\'est produite lors du traitement de la route "/account":', error);
        return res.redirect('/');
    }
});

// TODO : Il faudrait stocker l'id de la playlist pour éviter un call à l'API Spotify à chaque fois
async function refreshTrackList() {
    // On récupère les playlist de l'utilisateur
    const allPlaylists = await spotify.getAllPlaylist()
    // On récupère l'id de la playlist concernée
    let playlistId = allPlaylists.data["items"].filter((item) => item.name === process.env.SPOTIFY_PLAYLIST_NAME)

    console.log("playlistId", playlistId)

    if (playlistId === undefined || playlistId.length === 0) {
        // L'utilisateur n'a pas les droits sur la playlist
        spotify.resetToken()
        console.log("Vous n'avez pas les droits sur la playlist " + process.env.SPOTIFY_PLAYLIST_NAME)
        return res.send("Vous n'avez pas les droits sur la playlist " + process.env.SPOTIFY_PLAYLIST_NAME)

    } else {
        // On récupère les musiques de la playlist
        const playlistTracks = await spotify.getPlaylistTracks(playlistId[0]["id"])
        await saveTrackList(playlistTracks)
    }
}

async function getUserId(res, accessToken) {
    const response = await axios.get("https://api.spotify.com/v1/me", {
        headers: {
            Authorization: "Bearer " + accessToken,
        },
    });

    if (response.data.error) {
        console.error("Une erreur s'est produite lors de la récupération de l'ID de l'utilisateur:", response.data.error);
        throw response.data.error;
    }

    return response.data.id;
}

async function addUser(userId) {
    try {
        return await database.addUser(userId, nameDict[userId]);
    } catch (error) {
        console.error('Une erreur s\'est produite lors de l\'ajout de l\'utilisateur :', error);
        throw error;
    }
}


// #endregion

// #region Poll

app.get("/poll", (req, res) => {
    if (req.cookies.spotiPollToken === undefined) {
        return res.redirect('/');
    } else {
        res.sendFile(path.join(__dirname, "views/poll.html"));
    }

    log("VISIT", req.cookies.username + " a visité la page /poll")

});

app.get("/getPollData", async (req, res) => {
    if (req.cookies.spotiPollToken === undefined) {
        return res.redirect('/');
    } else {
      const current_user = await database.getUser(req.cookies.spotiPollToken);
      if (current_user.length > 0) {
        const current_user_id = current_user[0].id;
        let trackList = await database.getTrackList();
        if (trackList.length > 0) {
            const maxValue = trackList.length - 1;
            const randomNumber = generateRandomNumber(maxValue);
            const track = trackList[randomNumber];
            
            const current_user_vote = await database.getTodayUserVote(current_user_id);
            let vote;
            if (current_user_vote.length === 0) {
              vote = 0;
            } else {
              vote = current_user_vote[0].vote_answer;
            }

            const voteText = current_user_vote.length === 0 ? "Tu n'as pas encore voté" : "Tu as voté, mais tu peux modifier ton vote";
            
            const response = {
              "track": track, "vote": vote, "voteText": voteText
            };
            
            return res.send(response);
          }
        }
      res.redirect("/");
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

app.get("/vote", async (req, res) => {
    if (req.cookies.spotiPollToken === undefined) {
        return res.redirect('/');
    } else {
        log("VOTE", req.cookies.username + " a voté " + req.query.vote)
        const current_user = await database.getUser(req.cookies.spotiPollToken);
        if (current_user.length > 0) {
          const current_user_id = current_user[0].id;
          let trackList = await database.getTrackList();
          if (trackList.length > 0) {
              const maxValue = trackList.length - 1;
              const randomNumber = generateRandomNumber(maxValue);
              const track = trackList[randomNumber];
              const track_id = track.id;
              const vote = parseInt(req.query.vote);
              await database.addVote(vote, current_user_id, track_id);
            return res.redirect("/poll");
          }
        }
        return res.redirect("/");
    }
});

// #endregion

// #region Log and Tests

function log(type, message) {
    database.log(type, message).then(() => {
    })
}

app.get("/result", async (req, res) => {
    let votesList = await database.getTodayVotesList();

    // Un dictionnaire pour stocker le dernier vote de chaque utilisateur pour chaque morceau
    let lastVoteForUserPerTrack = {};

    // Triez la liste des votes en fonction de leur date de création
    votesList.sort((a, b) => new Date(b.created) - new Date(a.created));

    // Parcourez chaque vote et stockez le dernier vote de chaque utilisateur pour chaque morceau
    votesList.forEach(vote => {
        if (!lastVoteForUserPerTrack[vote.track_id]) {
            lastVoteForUserPerTrack[vote.track_id] = {};
        }

        if (!lastVoteForUserPerTrack[vote.track_id][vote.user_id]) {
            lastVoteForUserPerTrack[vote.track_id][vote.user_id] = vote.vote_answer;
        }
    });

    // Calculez la somme des derniers votes pour chaque morceau
    let sumOfLastVotesPerTrack = {};
    for (let trackId in lastVoteForUserPerTrack) {
        sumOfLastVotesPerTrack[trackId] = Object.values(lastVoteForUserPerTrack[trackId]).reduce((sum, vote) => sum + vote, 0);
    }

    res.send(JSON.stringify(sumOfLastVotesPerTrack))
});


app.post("/test", (req, res) => {
    console.log("test");
    console.log(req.body);
    return res.redirect("/");
});

app.get("/test", (req, res) => {
    database.deleteUser("123");
    return res.redirect("/");
});

// #endregion