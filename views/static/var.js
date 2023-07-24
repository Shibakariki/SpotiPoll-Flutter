function base64Encode(str) {
    return typeof btoa !== 'undefined' ? btoa(str) : Buffer.from(str).toString('base64');
  }

const clientID = "41eb08913f8b43e98d5b1c498f126541";
const clientSecret = "59c9a6dfb1b24f519ecf944098a83661";

const base64ClientID = base64Encode(clientID + ":" + clientSecret);
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

export { clientID, clientSecret, base64ClientID, redirectURI, scope };