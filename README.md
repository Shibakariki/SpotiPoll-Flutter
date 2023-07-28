# SpotiPoll

## Table des matières

- [Description](#description)
- [Installation](#installation)
- [Configuration des variables d'environnement](#configuration-des-variables-denvironnement)
- [Utilisation](#utilisation)

## Description

Blablabla trop cool ce projet

## Installation

1. Cloner le dépôt depuis GitHub :

```bash
git clone https://github.com/Shibakariki/SpotiPoll.git
cd SpotiPoll
```

2. Installer les dépendances :

```bash
npm install
```

## Configuration des variables d'environnement

1. Créer un fichier .env :
```bash
touch .env
```

2. Explication des variables d'environnement

**SPOTIFY_CLIENT_ID** et **SPOTIFY_CLIENT_SECRET** : Ces variables contiennent les informations d'identification pour accéder à l'API Spotify. Assurez-vous d'obtenir ces valeurs en vous inscrivant en tant que développeur sur le site Spotify et en créant une application.
   ```
   SPOTIFY_CLIENT_ID=""
   SPOTIFY_CLIENT_SECRET=""
   ```

**SPOTIFY_PLAYLIST_ID** : Cette variable contient l'identifiant de la playlist Spotify que vous souhaitez utiliser dans l'application.
   ```
   SPOTIFY_PLAYLIST_ID=""
   ```

**DELETE_SECURE_CODE** : Pour des raisons de sécurité, vous pouvez définir un code sécurisé qui devra être fourni pour exécuter certaines opérations sensibles (comme la suppression de données).
   ```
   DELETE_SECURE_CODE=""
   ```

**DISCORD_TOKEN** : C'est le token d'authentification de votre bot Discord. Assurez-vous de créer un bot Discord et d'obtenir le token d'accès pour le faire fonctionner.
   ```
   DISCORD_TOKEN=""
   ```

**DISCORD_CHANNEL_ID** : Cette variable contient l'identifiant du canal Discord dans lequel vous souhaitez que le bot envoie des messages.
   ```
   DISCORD_CHANNEL_ID=""
   ```

**REDIRECT_URL** : Si votre application utilise une redirection après l'authentification, vous pouvez spécifier l'URL de redirection ici.
   ```
   REDIRECT_URL=""
   ```

**BDD_FILEPATH** : C'est le chemin d'accès au fichier de base de données utilisé par l'application. Dans cet exemple, il s'agit d'un fichier JSON.
   ```
   BDD_FILEPATH=""
   ```
