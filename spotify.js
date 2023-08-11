import axios from 'axios';
import queryString from "node:querystring";

// TODO : Gérer le refresh du token
class SpotifyClient {
    constructor(redirectURI, clientID, clientSecret, scope) {
        this.accessToken = null;
        this.refreshToken = null;
        this.redirectURI = redirectURI;
        this.clientID = clientID;
        this.clientSecret = clientSecret;
        this.scope = `user-modify-playback-state
                        user-read-playback-state
                        user-read-currently-playing
                        user-library-modify
                        user-library-read
                        user-top-read
                        playlist-read-private
                        playlist-modify-public`;
        this.base64ClientID = Buffer.from(clientID + ":" + clientSecret).toString("base64")
        this.cachedPlaylistId = null;
    }

    async getAccessToken(code) {
        const spotifyResponse = await axios.post("https://accounts.spotify.com/api/token", queryString.stringify({
            grant_type: "authorization_code", code: code, redirect_uri: this.redirectURI,
        }), {
            headers: {
                Authorization: "Basic " + this.base64ClientID, "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        if (spotifyResponse.data.error) {
            console.error("Une erreur s'est produite lors de la récupération de l'access token:", spotifyResponse.data.error);
            throw spotifyResponse.data.error;
        }

        this.accessToken = spotifyResponse.data.access_token
        this.refreshToken = spotifyResponse.data.refresh_token
    }

    isTokenSet() {
        return this.accessToken != null && this.refreshToken != null;
    }

    resetToken() {
        this.accessToken = null;
        this.refreshToken = null;
    }

    async getAllPlaylist() {
        const all_playlists = await axios.get("https://api.spotify.com/v1/me/playlists", {
            headers: {
                Authorization: "Bearer " + this.accessToken,
            },
        });

        if (all_playlists.data.error) {
            console.error("Une erreur s'est produite lors de la récupération de la liste des playlists:", all_playlists.data.error);
        }
        return all_playlists;
    }

    // TODO : Stocker en BDD, la correspondance nom / id spotify
    async getPlaylistTracks(playlist_id) {
        const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
            headers: {
                Authorization: "Bearer " + this.accessToken,
            },
        });
    
        if (response.data.error) {
            console.error("Une erreur s'est produite lors de la récupération des pistes de la playlist:");
            throw response.data.error;
        }
    
        // Step 1: Identifier tous les ID d'utilisateurs uniques qui ont ajouté des chansons.
        const uniqueUserIds = new Set(response.data.items.map(item => item.added_by.id));
    
        // Step 2: Récupérer les noms de ces utilisateurs et les stocker dans un cache.
        const userNameCache = {};
        for (let userId of uniqueUserIds) {
            const userProfile = await this.getUserProfile(userId);
            userNameCache[userId] = userProfile.displayName || "Unknown";
        }
    
        // Step 3: Mapper les informations de piste et utiliser le cache pour le nom de l'utilisateur.
        return response.data.items.map(item => {
            const track = item.track;
            return {
                "id_track": track.id,
                "name": track.name,
                "artist": track.artists[0].name,
                "adder": userNameCache[item.added_by.id],
                "url": track.external_urls.spotify,
            };
        });
    }
    

    async getUserProfile(userId) {
    
        try {
            const response = await axios.get(`https://api.spotify.com/v1/users/${userId}`, {
                headers: {
                    Authorization: "Bearer " + this.accessToken,
                },
            });
    
            if (response.data.error) {
                console.error("Error fetching user profile:", response.data.error);
                throw new Error(response.data.error);
            }
    
            return {
                displayName: response.data.display_name,
                externalUrls: response.data.external_urls,
                followers: {
                    total: response.data.followers.total,
                },
                href: response.data.href,
                id: response.data.id,
                images: response.data.images,
                type: response.data.type,
                uri: response.data.uri
            };
    
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
            throw error;
        }
    }

    async getPlaylistId() {
        if (this.cachedPlaylistId) return this.cachedPlaylistId;

        const allPlaylists = await this.getAllPlaylist();
        const playlist = allPlaylists.data["items"].find((item) => item.name === process.env.SPOTIFY_PLAYLIST_NAME);

        if (!playlist) {
            throw "Vous n'avez pas les droits sur la playlist " + process.env.SPOTIFY_PLAYLIST_NAME;
        }

        this.cachedPlaylistId = playlist.id;
        return this.cachedPlaylistId;
    }

    async deleteTrack(res, playlist_id, track_id) {
        try {
            const delete_track = await axios({
                method: "delete", url: `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, headers: {
                    Authorization: `Bearer ${this.accessToken}`, "Content-Type": "application/json",
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

    getAuthURL() {
        return `https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID}&response_type=code`
            + `&redirect_uri=${process.env.REDIRECT_URL}&scope=${this.scope}`;
    }
}

export default SpotifyClient;