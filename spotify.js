import axios from 'axios';
import queryString from "node:querystring";


class SpotifyClient {
    constructor(redirectURI, clientID, clientSecret, database) {
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

        this.database = database;

        axios.interceptors.response.use(
            response => response,
            async error => {
                if (error.response.status === 401) {
                    await this.refreshAccessToken();
                    error.config.headers['Authorization'] = `Bearer ${this.accessToken}`;
                    return axios(error.config);
                }
                return Promise.reject(error);
            }
        );

    }

    async getAccessToken(code) {
        try {
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

            await this.database.saveCredentials(this.accessToken, this.refreshToken);
        } catch (error) {
            console.error("Error occurred while fetching the access token:", error);
            throw error;
        }
    }

    async isTokenSet() {
        const credentials = await this.database.getCredentials();
        if (credentials && credentials.length > 0) {
            this.accessToken = credentials[0].accessToken;
            this.refreshToken = credentials[0].refreshToken;
        }
        return this.accessToken != null && this.refreshToken != null;
    }

    resetToken() {
        this.accessToken = null;
        this.refreshToken = null;
    }

    async refreshAccessToken() {
        if (this.refreshToken == null) {
            console.log("Refreshing access token...");
            var credentials = await this.database.getCredentials();
            this.refreshToken = credentials[0].refreshToken;
        }
        try {
            const spotifyResponse = await axios.post("https://accounts.spotify.com/api/token", queryString.stringify({
                grant_type: "refresh_token",
                refresh_token: this.refreshToken,
            }), {
                headers: {
                    Authorization: "Basic " + this.base64ClientID,
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });

            if (spotifyResponse.data.error) {
                console.error("Error refreshing access token:", spotifyResponse.data.error);
                throw new Error(spotifyResponse.data.error);
            }

            this.accessToken = spotifyResponse.data.access_token;

            if (spotifyResponse.data.refresh_token) {
                this.refreshToken = spotifyResponse.data.refresh_token;
            }

            await this.database.saveCredentials(this.accessToken, this.refreshToken);
        } catch (error) {
            console.error("Failed to refresh access token:", error);
            throw error;
        }
    }


    getHeaders(contentType = "application/json") {
        return {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": contentType,
        };
    }

    async getAllPlaylists() {
        try {
            const limit = 50; // Maximum permis par l'API de Spotify
            let offset = 0;
            let allPlaylists = [];

            while (true) {
                const response = await axios.get(`https://api.spotify.com/v1/me/playlists?limit=${limit}&offset=${offset}`, {
                    headers: this.getHeaders()
                });

                if (response.data.error) {
                    throw new Error(response.data.error);
                }

                allPlaylists = allPlaylists.concat(response.data.items);

                if (response.data.items.length < limit) {
                    // Si le nombre d'items retournés est inférieur à la limite, cela signifie qu'on a récupéré toutes les playlists.
                    break;
                }

                offset += limit; // Augmenter l'offset pour la prochaine requête
            }

            return allPlaylists;

        } catch (error) {
            console.error("Une erreur s'est produite lors de la récupération de la liste des playlists:", error);
            throw error;
        }
    }


    // TODO : Stocker en BDD, la correspondance nom / id spotify
    async getPlaylistTracks(playlist_id) {
        const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
            headers: this.getHeaders()
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
                "image_url": track.album.images[1].url,
            };
        });
    }


    async getUserProfile(userId) {

        try {
            const response = await axios.get(`https://api.spotify.com/v1/users/${userId}`, {
                headers: this.getHeaders()
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

    async getPlaylistId(playlistName) {
        if (this.cachedPlaylistId) return this.cachedPlaylistId;

        const allPlaylists = await this.getAllPlaylists();

        const playlist = allPlaylists.find((item) => item.name === playlistName);

        if (!playlist) {
            throw new Error(`You do not have access to the playlist ${playlistName}`);
        }

        this.cachedPlaylistId = playlist.id;
        return this.cachedPlaylistId;
    }


    async deleteTrack(playlist_id, track_id) {
        try {
            if (this.accessToken == null || this.refreshToken == null)
            {
                await this.refreshAccessToken();
            }
            if (playlist_id == null)
            {
                var playlist_id = await this.getPlaylistId(process.env.SPOTIFY_PLAYLIST_NAME)
            }
            const response = await axios({
                method: "delete",
                url: `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,
                headers: this.getHeaders(),
                data: {
                    tracks: [{
                        uri: `spotify:track:${track_id}`
                    }],
                },
            });

            if (response.data.error) {
                throw new Error(response.data.error);
            }

            return true;  // Successful deletion can return true or some other relevant information

        } catch (error) {
            console.error("Error in deleteTrack:", error.message);
            throw error;  // Propagate the error up for the calling function to handle
        }
    }


    getAuthURL() {
        return `https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID}&response_type=code`
            + `&redirect_uri=${process.env.REDIRECT_URL}&scope=${this.scope}`;
    }
}

export default SpotifyClient;