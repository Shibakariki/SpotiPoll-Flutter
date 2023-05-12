import requests
import json
import base64

# Set up the Spotify API endpoints
AUTH_URL = 'https://accounts.spotify.com/authorize'
TOKEN_URL = 'https://accounts.spotify.com/api/token'
BASE_URL = 'https://api.spotify.com/v1/'

# Set up the client ID and client secret
RIKI_CLIENT_ID = "41eb08913f8b43e98d5b1c498f126541"
RIKI_CLIENT_SECRET = "59c9a6dfb1b24f519ecf944098a83661"

CLIENT_ID = RIKI_CLIENT_ID
CLIENT_SECRET = RIKI_CLIENT_SECRET
# Make a request to the /authorize endpoint to get an authorization code
auth_code = requests.get(AUTH_URL, {
    'client_id': CLIENT_ID,
    'response_type': 'code',
    'redirect_uri': 'https://open.spotify.com/collection/playlists',
    'scope': 'playlist-modify-private',
},verify=False)
print(auth_code)

auth_header = base64.urlsafe_b64encode((CLIENT_ID + ':' + CLIENT_SECRET).encode('ascii'))
headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Basic %s' % auth_header.decode('ascii')
}

payload = {
    'grant_type': 'authorization_code',
    'code': auth_code,
}

# Make a request to the /token endpoint to get an access token
access_token_request = requests.post(url=TOKEN_URL, data=payload, headers=headers,verify=False)

try:
    access_token = auth_response.json()["access_token"]

    headers = {
        "Authorization": "Bearer " + access_token
    }

    res = requests.get(url=BASE_URL+"me", headers=headers,verify=False)

    # Print the user's information
    print(res.json())
except:
    print("marche pas")