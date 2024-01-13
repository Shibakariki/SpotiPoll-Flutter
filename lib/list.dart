  import 'package:flutter/cupertino.dart';
  import 'package:flutter/material.dart';
import 'package:my_app/colors.dart';
  import 'package:pocketbase/pocketbase.dart';
  import 'package:http/http.dart' as http;
  import 'package:url_launcher/url_launcher.dart';

  class ListScreenBuilder extends StatefulWidget {
    final PocketBase pb;
    final bool isDarkMode;

    ListScreenBuilder({required this.pb, required this.isDarkMode});

    @override
    _ListScreenBuilderState createState() => _ListScreenBuilderState();
  }


  class _ListScreenBuilderState extends State<ListScreenBuilder> {
    final TextEditingController searchController = TextEditingController();
    late Future<List<RecordModel>> futureTracks;
    String searchQuery = '';

    @override
    void initState() {
      super.initState();
      futureTracks = widget.pb.collection('Track').getFullList(
        sort: '-created',
        filter: "is_delete!=1",
      );
    }

    @override
    Widget build(BuildContext context) {
      return FutureBuilder<List<RecordModel>>(
          future: futureTracks,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            } else if (snapshot.hasError) {
              return Center(child: Text('Error: ${snapshot.error}'));
            } else if (snapshot.hasData) {
              var filteredTracks = snapshot.data!.where((track) {
                return track.toJson()['name'].toString().toLowerCase().contains(searchQuery);
              }).toList();

              return Scaffold(
                backgroundColor: widget.isDarkMode ? AppColors.backgroundDark : AppColors.backgroundLight,
                body: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: TextField(
                        controller: searchController,
                        decoration: InputDecoration(
                          labelText: 'Search',
                          labelStyle: TextStyle(
                            color: widget.isDarkMode ? AppColors.subtitleDark : AppColors.subtitleLight,
                          ),
                          suffixIcon: Icon(
                            Icons.search,
                            color: widget.isDarkMode ? AppColors.subtitleDark : AppColors.subtitleLight,
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderSide: BorderSide(
                              color: widget.isDarkMode ? AppColors.subtitleDark : AppColors.subtitleLight,
                              width: 1.0,
                            ),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderSide: BorderSide(
                              color: widget.isDarkMode ? AppColors.titleDark : AppColors.titleLight,
                              width: 2.0,
                            ),
                          ),
                        ),
                        onChanged: (value) {
                          setState(() {
                            searchQuery = value.toLowerCase();
                          });
                        },
                      ),
                    ),
                    Expanded(
                      child: ListView.builder(
                        itemCount: filteredTracks.length,
                        itemBuilder: (context, index) {
                          var track = filteredTracks[index];
            // Implement the search filtering logic here
            if (searchQuery.isNotEmpty && !track.toJson()['name'].toString().toLowerCase().contains(searchQuery)) {
            return Container(); // Return empty container for non-matching items
            }
                    var trackImg = track.toJson()["image_url"].toString();
                    return Card(
                      color: widget.isDarkMode ? AppColors.cardBackgroundDark : AppColors.cardBackgroundLight,
                      child: ListTile(
                          leading: Image.network(
                            trackImg != "" ? trackImg : 'https://e1.pngegg.com/pngimages/230/166/png-clipart-symbolize-music-note-logo.png',
                            // Remplacez par l'URL de votre image ou utilisez un asset
                            width: 50, // Ajustez la largeur selon vos besoins
                            height: 50, // Ajustez la hauteur selon vos besoins
                            fit: BoxFit
                                .cover, // Cela garantit que l'image couvre tout l'espace défini
                          ),
                          title: Text(
                            track.toJson()['name'].toString(),
                            style: TextStyle(color: widget.isDarkMode ? AppColors.titleDark : AppColors.titleLight),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              Row(
                                children: <Widget>[
                                  Icon(Icons.person, size: 16, color: widget.isDarkMode ? AppColors.subtitleDark : AppColors.subtitleLight), // Icône pour l'artiste
                                  const SizedBox(width: 2), // Espace entre l'icône et le texte
                                  Text(
                                    '${track.toJson()['artist']}',
                                    style: TextStyle(color: widget.isDarkMode ? AppColors.subtitleDark : AppColors.subtitleLight),
                                  ), // Nom de l'artiste
                                ],
                              ),
                              Row(
                                children: <Widget>[
                                  Icon(Icons.add, size: 16,color: widget.isDarkMode ? AppColors.subtitleDark : AppColors.subtitleLight), // Icône pour l'ajouteur
                                  const SizedBox(width: 2), // Espace entre l'icône et le texte
                                  Text(
                                    '${track.toJson()['adder']}',
                                    style: TextStyle(color: widget.isDarkMode ? AppColors.subtitleDark : AppColors.subtitleLight),
                                  ), // Nom de l'ajouteur
                                ],
                              ),
                            ],
                          ),
                          trailing: ElevatedButton(
                            onPressed: () async {
                              var url = Uri.parse(track.toJson()["url"].toString());
                              if (await canLaunchUrl(url)) {
                                await launchUrl(url);
                              } else {
                                print('Impossible de lancer l\'URL');
                              }
                            },
                            child: const Icon(Icons.play_arrow, color: Colors.white, size: 30), // Icône plus grande
                            style: ElevatedButton.styleFrom(
                              shape: const CircleBorder(),
                              backgroundColor: AppColors.greenSpotify, // Couleur de fond
                            ),
                          )
                      ),
                    );
                  },
                      ),
                    ),
                  ],
                ),
              );
            } else {
              return const Center(child: Text('No data available'));
            }
      },
    );
  }

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }
  }