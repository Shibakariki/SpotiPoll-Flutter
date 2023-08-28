import express from "express";
import CryptoJS from "crypto-js";
import cookieParser from "cookie-parser";
import { config as configDotenv } from "dotenv";

import PocketBase from "pocketbase/cjs";

import Database from './database.js';
import Spotify from './spotify.js';

import path, { dirname } from "path";
import { fileURLToPath } from 'url';

import eventsource from 'eventsource';

const app = express();

configDotenv();

global.EventSource = eventsource;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Liste des noms de variables d'environnement requises
const requiredEnvVariables = ['REDIRECT_URL', 'SPOTIFY_PLAYLIST_NAME', 'SPOTIFY_CLIENT_SECRET', 'SPOTIFY_CLIENT_ID', 'PB_USERNAME', 'PB_PASSWORD'];

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

const database = new Database();
const spotify = new Spotify(process.env.REDIRECT_URL, process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET)
app.listen(1443, () => {
    console.log("App is listening on port 1443! localhost:1443\n");
});

app.use(express.json());
app.use(cookieParser());
app.use("/static", express.static('./views/static/'));

function initializePocketBase(req, res, next) {
    req.pbClient = new PocketBase(process.env.PB_URI);
    req.pbClient.authStore.loadFromCookie(req.headers.cookie || '');
    req.pbClient.authStore.onChange(() => {
        res.setHeader("Set-Cookie", req.pbClient.authStore.exportToCookie({ httpOnly: false }));
    });

    next();
}

async function refreshAuthState(req, res, next) {
    try {
        if (req.pbClient.authStore.isValid) {
            await req.pbClient.collection('users').authRefresh();
        }
        next();
    } catch (error) {
        console.error('Error refreshing authentication state:', error);
        req.pbClient.authStore.clear();
        return res.status(401).redirect('/');
    }
}

async function verifyToken(req, res, next) {
    initializePocketBase(req, res, async () => {
        await refreshAuthState(req, res, async () => {
            if (req.pbClient.authStore.isValid) {
                next();
            } else {
                return res.redirect('/');
            }
        });
    });
}

// TODO : Revoir la logique de connection pour intégrer le verifyToken
// Et revoir l'utilisation du isTokenSet pour éviter qu'il soit nécessaire à chaque fois
app.get("/", async (req, res) => {
    console.log("cc le sanfg");
    if (!spotify.isTokenSet()) {
        return res.sendFile(path.join(__dirname, "views/initAdmin.html"));
    }

    // If a cookie token exists, redirect to the track_list page
    if (req.cookies.token) {
        return res.redirect('/track_list');
    }

    // If the cookie token does not exist, redirect to the connect page
    return res.sendFile(path.join(__dirname, "views/connect.html"));
});


app.get("/user_connection", verifyToken, async (req, res) => {
    if (!spotify.isTokenSet()) {
        return res.redirect('/');
    } else {
        log("CONNECT", req.pbClient.authStore.baseModel.name + " s'est connecté");
        return res.redirect("/track_list");
    }
});

// #region Gestion des Tracks
app.get("/track_list", verifyToken, async (req, res) => {
    if (!spotify.isTokenSet()) {
        return res.redirect('/');
    } else {
        return res.sendFile(path.join(__dirname, "views/tracklist.html"));
    }
});

app.get('/authSpotify', async (req, res) => {
    return res.redirect(spotify.getAuthURL());
});

app.get('/refreshTrackList', async (req, res) => {
    if (!spotify.isTokenSet()) {
        return res.redirect('/');
    } else {
        try {
            await refreshTrackList();
            return res.redirect('/track_list');
        } catch (error) {
            console.error('Une erreur s\'est produite lors de la récupération des pistes :', error);
            return res.redirect('/track_list');
        }
    }
});

app.get("/getTrackList", verifyToken, async (req, res) => {
    log("VISIT", req.pbClient.authStore.baseModel.name + " a visité la page /track_list");
    const allTrack = await database.getTrackList();
    res.send(allTrack);
});

async function saveTrackList(all_tracks) {
    try {
        let dbTrackList = await database.getTrackList();

        // Ajout de nouvelles pistes
        let newTracks = all_tracks.filter(
            track => !dbTrackList.some(dbTrack => dbTrack.id_track === track.id_track)
        );
        for (const track of newTracks) {
            await database.addTrack(track);
        }

        // Suppression des pistes qui ne sont pas dans la playlist Spotify
        let tracksToRemove = dbTrackList.filter(
            dbTrack => !all_tracks.some(track => track.id_track === dbTrack.id_track)
        );
        for (const track of tracksToRemove) {
            await database.removeTrack(track.id_track);
        }

    } catch (error) {
        console.error('Une erreur s\'est produite lors de la mise à jour des pistes dans la base de données :', error);
        throw error;
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

        log("INIT", "Initialisation effectuée");
        return res.redirect('/');

    } catch (error) {
        console.error('Une erreur s\'est produite lors du traitement de la route "/account":', error);
        return res.redirect('/');
    }
});

async function refreshTrackList() {
    try {
        const playlistId = await spotify.getPlaylistId(process.env.SPOTIFY_PLAYLIST_NAME);
        const playlistTracks = await spotify.getPlaylistTracks(playlistId);
        await saveTrackList(playlistTracks);
    } catch (error) {
        console.error(error);
        spotify.resetToken();
    }
}

// #endregion

// #region Poll

app.get("/poll", verifyToken, (req, res) => {
    log("VISIT", req.pbClient.authStore.baseModel.name + " a visité la page /poll")
    res.sendFile(path.join(__dirname, "views/poll.html"));
});

app.get("/getPollData", verifyToken, async (req, res) => {
    const current_user = req.pbClient.authStore;
    const current_user_id = current_user.baseModel.id;
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
            "track": track, "vote": vote, "voteText": voteText, "name": current_user.baseModel.name
        };

        return res.send(response);
    }
    res.redirect("/");
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

app.get("/vote", verifyToken, async (req, res) => {
    log("VOTE", req.pbClient.authStore.baseModel.name + " a voté " + req.query.vote)
    const current_user = req.pbClient.authStore;
    const current_user_id = current_user.baseModel.id;
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
    return res.redirect("/");

});

// #endregion

// #region Log and Tests

function log(type, message) {
    database.log(type, message).then(() => {
    })
}

app.get("/result", verifyToken, async (req, res) => {
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