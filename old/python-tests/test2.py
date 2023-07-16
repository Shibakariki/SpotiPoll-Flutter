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
# redirect_uri = "YOUR_REDIRECT_URI" # e.g. http://localhost:8000/callback/ --> you will have to whitelist this url in the spotify developer dashboard 

auth_headers = {
    "client_id": CLIENT_ID,
    "response_type": "code",
    "redirect_uri": "http://localhost:7777/callback",
    "scope": "user-library-read"
}

auth_code = requests.get(AUTH_URL, {
    'client_id': CLIENT_ID,
    'response_type': 'code',
},verify=False)
print(auth_code)