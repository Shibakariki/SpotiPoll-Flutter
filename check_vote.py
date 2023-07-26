import os
#open and parse a json file
import json

path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'html/Spotipoll/views/static/fichier.json'))

with open(path) as json_file:
    json_data = json.load(json_file)

for user in json_data["users"]:
    print(str(user["name"]) + " a voté " + str(user["vote"]))
