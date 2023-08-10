import axios from 'axios';
import queryString from "node:querystring";

// TODO : Gérer le refresh du token
class SpotifyClient {
    constructor(redirectURI, clientID, clientSecret) {
        this.accessToken = null;
        this.refreshToken = null;
        this.redirectURI = redirectURI;
        this.clientID = clientID;
        this.clientSecret = clientSecret;
        this.base64ClientID = Buffer.from(clientID + ":" + clientSecret).toString("base64")
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

    async getPlaylistTracks(playlist_id) {
        const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
            headers: {
                Authorization: "Bearer " + this.accessToken,
            },
          }
        );
    
        if (response.data.error) {
          console.error("Une erreur s'est produite lors de la récupération des pistes de la playlist:",);
          throw response.data.error;
      }
        return response.data.items.map(item => {
            const track = item.track;
            const added_by_id = item.added_by.id;
    
            return {
                "id_track": track.id,
                "name": track.name,
                "artist": track.artists[0].name,
                "adder": "NOT IMPLEMENTED ... YET",
                "url": track.external_urls.spotify,
            };
        });
    }

    async deleteTrack(res, playlist_id, track_id) {

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

}

export default SpotifyClient;