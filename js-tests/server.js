const express = require("express");
const app = express();
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

app.listen(8080, () => {
  console.log("App is listening on port 8080! localhost:8080\n");
});

//this page contains the link to the spotify authorization page
//contains custom url queries that pertain to my specific app
app.get("/", (req, res) => {
  res.send(
    "<a href='https://accounts.spotify.com/authorize?client_id=" +
      clientID +
      "&response_type=code&redirect_uri="+redirectURI+"&scope="+scope+"'>Sign in</a>"
  );
});

//this is the page user is redirected to after accepting data use on spotify's website
//it does not have to be /account, it can be whatever page you want it to be
app.get("/account", async (req, res) => {
  console.log(req.query.code);
  const spotifyResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      queryString.stringify({
        grant_type: "authorization_code",
        code: req.query.code,
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

    console.log(spotifyResponse.data);

    // console.log("Access Token: " + accessToken);

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

    const playlist_id = all_playlists.data["items"].filter((item) => item.name === "WtfCanadianTapeN°001")[0]["id"];

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

    var all_tracks = playlist_tracks.data["items"];
    all_tracks = all_tracks.map((item) => new Track(item["track"]["id"], item["track"]["name"], item["track"]["artists"][0]["name"], item["added_by"]["id"]));
    // console.log(all_tracks);

    const track_to_delete = all_tracks.filter((item) => item.name === "Hello (feat. A Boogie Wit da Hoodie)");
    
    // const delete_track = await axios.delete(
    //   "https://api.spotify.com/v1/playlists/"+playlist_id+"/tracks",
    //   {
    //     headers: {
    //       Authorization: "Bearer " + accessToken,
    //       "Content-Type": "application/json"
    //     },
    //     data: {
    //       tracks: [
    //         {
    //           uri: "spotify:track:"+track_to_delete[0].id
    //         }
    //       ]
    //     }
    //   }
    // );

    // if (delete_track.data.error) {
    //   res.send("Error: " + delete_track.data.error);
    //   res.redirect('/');
    // }

    res.redirect('/');
})