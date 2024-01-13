import 'package:flutter/material.dart';
import 'package:my_app/vote.dart';
import 'package:my_app/list.dart';
import 'package:my_app/account.dart';
import 'package:my_app/main.dart';
import 'package:my_app/colors.dart';
import 'package:pocketbase/pocketbase.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'PBProvider.dart';

class AppView extends StatefulWidget {
  final String defaultUsername;

  const AppView({
    super.key,
    this.defaultUsername = '',
  });

  @override
  _AppViewState createState() => _AppViewState();
}

class _AppViewState extends State<AppView> {
  int _selectedIndex = 0;
  late bool isDarkMode = false;

  Future<void> _loadThemeMode() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      isDarkMode = prefs.getBool('isDarkMode') ?? false;
    });
  }

  Future<void> _toggleThemeMode() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      isDarkMode = !isDarkMode;
      prefs.setBool('isDarkMode', isDarkMode);
    });
  }

  @override
  void initState() {
    super.initState();
    _loadThemeMode();
  }


  @override
  Widget build(BuildContext context) {
    final PocketBase pb = PBProvider.of(context)!.pb;
    final voteScreenBuilder = VoteScreenBuilder();
    ListScreenBuilder(pb: pb, isDarkMode: isDarkMode);
    final accountScreenBuilder = AccountScreenBuilder();

    final List<Widget> _widgetOptions = <Widget>[
      ListScreenBuilder(pb: pb, isDarkMode: isDarkMode),
      voteScreenBuilder.buildVoteScreen(pb, isDarkMode),
      accountScreenBuilder.buildAccountScreen(pb, isDarkMode),
    ];

    return MaterialApp(
      title: 'SpotiPoll',
      theme: lightTheme,
      darkTheme: darkTheme,
      themeMode: isDarkMode ? ThemeMode.dark : ThemeMode.light,
      home: Scaffold(
        appBar: AppBar(
          title: Text(
            'SpotiPoll',
            style: TextStyle(color: isDarkMode ? AppColors.titleDark : AppColors.titleLight),
          ),
          centerTitle: true,
          actions: _selectedIndex == 2 ? [
            IconButton(
              icon: Icon(
                isDarkMode ? Icons.wb_sunny : Icons.nightlight_round,
                color: isDarkMode ? AppColors.navBarItemDark : AppColors.navBarItemLight,
              ),
              onPressed: _toggleThemeMode,
            ),
          ] : [],
          backgroundColor: isDarkMode ? AppColors.backgroundDark : AppColors.backgroundLight,
          // Définit la couleur de fond comme transparente
          elevation: 0, // Supprime l'ombre sous l'AppBar
        ),
        body: Stack(
          children: [
            // Votre contenu principal ici
            Center(
              child: _widgetOptions.elementAt(_selectedIndex),
            ),
          ],
        ),
        bottomNavigationBar: BottomNavigationBar(
          backgroundColor: isDarkMode ? AppColors.backgroundDark : AppColors.backgroundLight,
          items: <BottomNavigationBarItem>[
            BottomNavigationBarItem(
              icon: Icon(
                  Icons.list,
                  color: _selectedIndex == 0 ?
                  isDarkMode ? AppColors.navBarSelectedItemDark : AppColors.navBarSelectedItemLight :
                  isDarkMode ? AppColors.navBarItemDark : AppColors.navBarItemLight),
              label: 'Playlist',
            ),
            BottomNavigationBarItem(
              icon: Icon(
                  Icons.how_to_vote,
                  color: _selectedIndex == 1 ?
                  isDarkMode ? AppColors.navBarSelectedItemDark : AppColors.navBarSelectedItemLight :
                  isDarkMode ? AppColors.navBarItemDark : AppColors.navBarItemLight),
              label: 'Vote',
            ),
            BottomNavigationBarItem(
                icon: Icon(
                    Icons.account_box_rounded,
                    color: _selectedIndex == 2 ?
                    isDarkMode ? AppColors.navBarSelectedItemDark : AppColors.navBarSelectedItemLight :
                    isDarkMode ? AppColors.navBarItemDark : AppColors.navBarItemLight),
                label: "Profile"
            ),
          ],
          currentIndex: _selectedIndex,
          selectedItemColor: isDarkMode ? AppColors.navBarSelectedItemDark : AppColors.navBarSelectedItemLight,
          unselectedItemColor: isDarkMode ? AppColors.navBarItemDark : AppColors.navBarItemLight,
          onTap: (int index) {
            setState(() {
              _selectedIndex = index;
            });
          },
        ),
      ),
    );

  }
}