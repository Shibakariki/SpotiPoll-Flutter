import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:pocketbase/pocketbase.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:my_app/colors.dart';
import 'package:my_app/SuccessCard.dart';

import 'PBProvider.dart';
import 'main.dart';

class AccountScreenBuilder {
  Widget buildAccountScreen(PocketBase pb, bool isDarkMode) {
    return FutureBuilder<List<dynamic>>(
        future: Future.wait([
          pb.collection('users').getFullList(),
          pb.collection('Track').getFullList(),
          pb.collection('Result').getFullList(),
          pb.collection('Vote').getFullList(sort:'-created'),
        ]),
    builder: (context, AsyncSnapshot<List<dynamic>> snapshot) {
      if (snapshot.connectionState == ConnectionState.waiting) { return const Center(child: CircularProgressIndicator()); }
      else if (snapshot.hasError) { return Center(child: Text('Error: ${snapshot.error}')); }
      else if (snapshot.hasData) {
        if (snapshot.data!.length >= 2 && snapshot.data![0] != null &&
            snapshot.data![1] != null) {
          var usersData = snapshot.data![0];
          var user = usersData.isNotEmpty ? usersData[0].toJson() : {};
          final username = user.isNotEmpty ? user["name"] : "Unknown";
          var userImg = user["avatarUrl"];

          List<RecordModel> tracksData = snapshot.data![1];
          List<RecordModel> resultData = snapshot.data![2];
          List<RecordModel> voteData = snapshot.data![3];

          // Succès Add Musique
          var addedTracks = tracksData.where((track) {
            return track.getDataValue("adder") == username;
          }).toList();
          var addedIdTrack = addedTracks.map((track) {
            return track.id;
          }).toList();

          int songAdded = addedTracks.length;
          int maxSongAdded = 40;

          // Succès Musique Suppr
          var deleteTracks = tracksData.where((track) {
            return (track.getDataValue("adder") == username) && (track.getDataValue("is_delete") == true);
          }).toList();
          int songDelete = deleteTracks.length;
          int maxSongDelete = 20;

          // Succès Musique Survivantes
          var votedTracks = resultData.where((result) {
            return addedIdTrack.contains(result.getDataValue("id_track"));
          }).map((result) {
            return result.getDataValue("id_track");
          }).toList();

          var survivedTracks = addedTracks.where((track) {
            return (votedTracks.contains(track.id)) && (track.getDataValue("is_delete") == false);
          }).toList();
          int songSurvived = survivedTracks.length;
          int maxSongSurvived = 50;
          
          // Succès Nombre de votes
          var userVotes = voteData.where((vote) {
            return vote.getDataValue("user_id") == user["id"];
          }).toList();
          // Créer un Map pour regrouper les votes par jour
          Map<String, RecordModel> lastVoteEachDay = {};

          for (var vote in userVotes) {
            // Convertir la date de création en une chaîne de caractères qui représente le jour
            String day = DateFormat('yyyy-MM-dd').format(DateTime.parse(vote.created));

            // Si le jour actuel n'est pas dans le map ou si le vote est plus récent, le mettre à jour
            if (!lastVoteEachDay.containsKey(day) || DateTime.parse(lastVoteEachDay[day]!.created).isBefore(DateTime.parse(vote.created))) {
              lastVoteEachDay[day] = vote;
            }
          }
          // Maintenant, lastVoteEachDay contient le dernier vote de chaque jour
          List<RecordModel> lastVotes = lastVoteEachDay.values.toList();
          int songVoted = lastVotes.length;
          int maxSongVoted = 150;

          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                ClipRRect(
                  borderRadius: BorderRadius.circular(60),
                  // Rayon pour les coins arrondis
                  child: Image.network(
                    userImg.isNotEmpty
                        ? userImg
                        : 'https://e1.pngegg.com/pngimages/230/166/png-clipart-symbolize-music-note-logo.png',
                    width: 120,
                    height: 120,
                    fit: BoxFit.cover,
                  ),
                ),
                Text(
                  username,
                  style: TextStyle(
                      color: isDarkMode
                          ? AppColors.titleDark
                          : AppColors.titleLight,
                      fontSize: 26),
                ),
                Column(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(
                          bottom: 8.0, right: 15, left: 15),
                      // Ajouter un espacement personnalisé
                      child: SuccessCard(title: "Musiques ajoutées",
                          subtitle: "Ajouter un maximum de musique dans la playlist",
                          advencement: songAdded,
                          maxAdvencement: maxSongAdded,
                          isDarkMode: isDarkMode),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(
                          bottom: 8.0, right: 15, left: 15),
                      // Ajouter un espacement personnalisé
                      child: SuccessCard(title: "Musiques supprimées",
                          subtitle: "Vos morceaux n'ont pas été appréciés de tous, c'est pourquoi ils ont été retirés.",
                          advencement: songDelete,
                          maxAdvencement: maxSongDelete,
                          isDarkMode: isDarkMode),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(
                          bottom: 8.0, right: 15, left: 15),
                      // Ajouter un espacement personnalisé
                      child: SuccessCard(title: "Survivor",
                          subtitle: "Vos morceaux ont été validés par la majorité, trop fort !",
                          advencement: songSurvived,
                          maxAdvencement: maxSongSurvived,
                          isDarkMode: isDarkMode),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(
                          bottom: 8.0, right: 15, left: 15),
                      // Ajouter un espacement personnalisé
                      child: SuccessCard(title: "Voteur fou",
                          subtitle: "Voter voter voter !!",
                          advencement: songVoted,
                          maxAdvencement: maxSongVoted,
                          isDarkMode: isDarkMode),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(
                          bottom: 8.0, right: 15, left: 15),
                      // Ajouter un espacement personnalisé
                      child: SuccessCard(title: "???",
                          subtitle: "Succès mystère",
                          advencement: 0,
                          maxAdvencement: 1,
                          isDarkMode: isDarkMode),
                    ),
                  ],
                ),
                ElevatedButton(
                  onPressed: () async {
                    final prefs = await SharedPreferences.getInstance();
                    prefs.setString("token", "");
                    pb.authStore.save("", null);
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(builder: (context) => MyApp()),
                      );
                    });
                  },
                  style: ButtonStyle(
                    backgroundColor: MaterialStateProperty.all<Color>(
                        isDarkMode
                            ? AppColors.btnDisconnectBackgroundDark
                            : AppColors.btnDisconnectBackgroundLight
                    ),
                    // Couleur de fond du bouton
                    shape: MaterialStateProperty.all<RoundedRectangleBorder>(
                      RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                        // Bord arrondi
                        side: BorderSide(color: Colors.black),
                      ),
                    ),
                  ),
                  child: Text(
                    "Déconnexion",
                    style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isDarkMode
                            ? AppColors.btnDisconnectDark
                            : AppColors.btnDisconnectLight
                    ),
                  ),
                ),
              ],
            ),
          );
        }
        else { return const Center(child: Text('No data available')); }
      }
      else { return const Center(child: Text('No data available')); }
    });
  }
}
