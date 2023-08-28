#!/bin/bash
npm install
npm start

chmod +x pocketbase
./pocketbase serve --https="https://spotipoll.onrender.com:7035"
