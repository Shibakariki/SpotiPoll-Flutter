#!/bin/bash

apt-get update 
apt-get upgrade -y
apt-get npm install -y
npm install
npm start

curl https://github.com/pocketbase/pocketbase/releases/download/v0.17.7/pocketbase_0.17.7_linux_amd64.zip -o pocketbase.zip
unzip pocketbase.zip
chmod +x pocketbase
./pocketbase serve --https="https://spotipoll.onrender.com:7035"
