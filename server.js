import express from "express";
import queryString from "node:querystring";
import axios from "axios";
import CryptoJS from "crypto-js";
import cookieParser from "cookie-parser";
import {config as configDotenv} from "dotenv";

import Database from './database.js';
import {promises as fs} from "fs";
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

const scope = `user-modify-playback-state
    user-read-playback-state
    user-read-currently-playing
    user-library-modify
    user-library-read
    user-top-read
    playlist-read-private
    playlist-modify-public`;

const database = new Database();

class Track {
    constructor(id, name, artist, adder, url) {
        this.id = id;
        this.name = name;
        this.artist = artist;
        this.adder = adder;
        this.url = url;
    }
}

app.listen(1443, () => {
    console.log("App is listening on port 1443! localhost:1443\n");
});

app.use(express.json());
app.use(cookieParser());
app.use("/static", express.static('./views/static/'));

//this page contains the link to the spotify authorization page
//contains custom url queries that pertain to my specific app
app.get("/", async (req, res) => {
    return res.sendFile(path.join(__dirname, "views/connect.html"));
});

// #region Gestion des Tracks

app.get("/track_list", async (req, res) => {
    if (req.cookies.spotiPollToken === undefined) {
        return res.redirect('/');
    } else {
        return res.sendFile(path.join(__dirname, "views/tracklist.html"));
    }
});

app.get('/refreshTrackList', (req, res) => {
    const spotifyURL = "https://accounts.spotify.com/authorize?client_id=" + clientID + "&response_type=code&redirect_uri=" + redirectURI + "&scope=" + scope;

    return res.redirect(spotifyURL);
});

app.get("/getTrackList", async (req, res) => {
    try {
        if (req.cookies.spotiPollToken === undefined) {
            return res.redirect('/');
        } else {
            log("VISIT", req.cookies.username + " a visité la page /track_list");

            let communHTML = ``;
            const allTrack = await database.getTrackList();
            return showAllTrack(res, allTrack, communHTML); //gère le 0 tracks et return un html
        }
    } catch (error) {
        console.error('Une erreur s\'est produite dans la route "/track_list":', error);
        // Gérer l'erreur en renvoyant une réponse appropriée à l'utilisateur
        res.status(500).send('Une erreur s\'est produite. Veuillez réessayer ultérieurement.');
    }
});

async function saveTrackList(all_tracks) {
    try {
        // Pour chaque piste, on vérifie si elle existe déjà dans la base de données
        let dbTrackList = await database.getTrackList();
        for (const track of all_tracks) {
            const trackExists = dbTrackList.some(dbTrack => dbTrack.id === track.id);
            if (!trackExists) {
                // Si elle n'existe pas, on l'ajoute à la base de données
                await database.addTrack(track);
            }
        }
    } catch (error) {
        console.error('Une erreur s\'est produite lors de la sauvegarde des pistes dans la base de données :', error);
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

app.get("/account", async (req, res) => {
    try {
        if (!req.query.code) {
            return res.redirect('/');
        }

        const accessToken = await getAccessToken(req.query.code);
        const userId = await getUserId(res, accessToken);
        if (await checkUserExist(userId, accessToken, res)) {
            // var playlistId = process.env.SPOTIFY_PLAYLIST_ID;

            const allPlaylists = await getAllPlaylist(res, accessToken);
            let playlistId = allPlaylists.data["items"].filter((item) => item.name === "WtfCanadianTapeN°001")[0]["id"];

            const playlistTracks = await getPlaylistTracks(accessToken, playlistId);

            await saveTrackList(playlistTracks);

            log("CONNECT", req.cookies.username + " s'est connecté")
            return res.redirect('/track_list');
        }
        return res.redirect('/');
    } catch (error) {
        console.error('Une erreur s\'est produite lors du traitement de la route "/account":', error);
        return res.redirect('/');
    }
});

async function checkUserExist(userId, accessToken, res) {
    try {
        const allUsers = await database.getUsersList();
        if (allUsers.filter((user) => user.id !== userId)) {
            await addUser(userId);
        }
        res.cookie("username", nameDict[userId], {
            expires: new Date(Date.now() + 1800000), httpOnly: true
        }); //cookie expire in 30 minutes
        res.cookie("spotiPollToken", userId, {
            expires: new Date(Date.now() + 1800000), httpOnly: true
        }); //cookie expire in 30 minutes
        res.cookie("spotifAccessToken", accessToken, {
            expires: new Date(Date.now() + 1800000), httpOnly: true
        }); //cookie expire in 30 minutes
        return true;

    } catch (error) {
        console.error('Une erreur s\'est produite lors de la vérification de l\'existence de l\'utilisateur :', error);
        return false;
    }
}

async function getAccessToken(code) {
    const spotifyResponse = await axios.post("https://accounts.spotify.com/api/token", queryString.stringify({
        grant_type: "authorization_code", code: code, redirect_uri: redirectURI,
    }), {
        headers: {
            Authorization: "Basic " + base64ClientID, "Content-Type": "application/x-www-form-urlencoded",
        },
    });

    if (spotifyResponse.data.error) {
        console.error("Une erreur s'est produite lors de la récupération de l'access token:", spotifyResponse.data.error);
        throw spotifyResponse.data.error;
    }
    return spotifyResponse.data.access_token;
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

async function getAllPlaylist(res, accessToken) {
    const all_playlists = await axios.get("https://api.spotify.com/v1/me/playlists", {
        headers: {
            Authorization: "Bearer " + accessToken,
        },
    });

    if (all_playlists.data.error) {
        console.error("Une erreur s'est produite lors de la récupération de la liste des playlists:", all_playlists.data.error);
    }
    return all_playlists;
}

async function getPlaylistTracks(accessToken, playlist_id) {
    const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
        headers: {
            Authorization: "Bearer " + accessToken,
        },
    });

    if (response.data.error) {
        console.error("Une erreur s'est produite lors de la récupération des pistes de la playlist:",);
        throw response.data.error;
    }

    return response.data.items.map(item => {
        const track = item.track;
        const added_by_id = item.added_by.id;
        const track_id = track.id;
        const track_name = track.name;
        const track_artist = track.artists[0].name;
        const track_adder = nameDict[added_by_id];
        const track_url = track.external_urls.spotify;
        return new Track(track_id, track_name, track_artist, track_adder, track_url);
    });
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
        let trackList = await database.getTrackList();
        if (trackList.length > 0) {
            const maxValue = trackList.length - 1;
            const randomNumber = generateRandomNumber(maxValue);
            const track = trackList[randomNumber];

            const voteText = current_user.vote === 0 ? "Tu n'as pas encore voté" : "Tu as voté, mais tu peux modifier ton vote";

            const response = {
                "track": track, "vote": current_user.vote, "voteText": voteText
            };
            res.send(response);
        } else {
            res.redirect("/");
        }
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
    if (req.cookies.spotiPollToken === undefined) {
        return res.redirect('/');
    } else {
        log("VOTE", req.cookies.username + " a voté " + req.query.vote)

        if (req.query.vote === "yes") {
            current_user.vote = 1;
        } else if (req.query.vote === "no") {
            current_user.vote = -1;
        }

        modifyUser(current_user);

        return res.redirect("/poll");
    }
});

// #endregion

// #region Delete Track

async function deleteTrack(res, playlist_id, track_id) {

    try {
        const delete_track = await axios({
            method: "delete", url: `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, headers: {
                Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json",
            }, data: {
                tracks: [{
                    uri: `spotify:track:${track_id}`
                }],
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

// #endregion

// #region Log and Tests

function log(type, message) {
    database.log(type, message).then(() => {
    })
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

app.post("/test", (req, res) => {
    console.log("test");
    console.log(req.body);
    return res.redirect("/");
});

app.get("/test", (req, res) => {

    return res.redirect("/");
});

// #endregion