import 'package:flutter/material.dart';
import 'package:pocketbase/pocketbase.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:my_app/colors.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

import 'PBProvider.dart';
import 'app.dart';

void main() {
  final pb = PocketBase('https://pocketbase-spotipoll.fly.dev');
  runApp(PBProvider(pb: pb, child: const MyApp()));
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  _MyAppState createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  late bool isDarkMode = false;
  late bool isConnected = false;
  late String token;

  @override
  void initState() {
    super.initState();
    _loadThemeMode();
    _loadToken();
  }

  Future<void> _loadThemeMode() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      isDarkMode = prefs.getBool('isDarkMode') ?? false;
    });
  }

  Future<void> _loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    if (prefs.containsKey("token")){
      setState(() {
        token = prefs.getString("token")!;
        //token = "";
      });
      PocketBase pb = PBProvider.of(context)!.pb;
      pb.authStore.save(token, null);
      if(pb.authStore.isValid){
        isConnected = true;
      }
    }
  }

  Future<void> _toggleThemeMode() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      isDarkMode = !isDarkMode;
      prefs.setBool('isDarkMode', isDarkMode);
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SpotiPoll',
      theme: lightTheme,
      darkTheme: darkTheme,
      themeMode: isDarkMode ? ThemeMode.dark : ThemeMode.light,
      home: MyHomePage(
        title: 'SpotiPoll',
        isDarkMode: isDarkMode,
        isConnected: isConnected,
        toggleTheme: _toggleThemeMode,
      ),
    );
  }
}

class MyHomePage extends StatefulWidget {
  final String title;
  final bool isDarkMode;
  final bool isConnected;
  final VoidCallback toggleTheme;

  const MyHomePage({
    super.key,
    required this.title,
    required this.isDarkMode,
    required this.isConnected,
    required this.toggleTheme,
  });

  @override
  _MyHomePageState createState() => _MyHomePageState();
}

class _MyHomePageState extends State<MyHomePage> {

  bool isAuthenticated = false;
  late PocketBase pb;

  @override
  void initState() {
    super.initState();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    pb = PBProvider.of(context)!.pb;
    checkAuthentication();
  }

  Future<bool> checkAuthentication() async {
    return pb.authStore.isValid;
  }

  void _login() async {
    dynamic authData;

    try {
      authData = await pb.collection('users').authWithOAuth2(
          'spotify', (url) async {
          await launchUrl(url);
        }
      );

      if (pb.authStore.isValid) {
        /*Map<String, dynamic> data = {
          "name": authData.meta.name,
          "id_spotify": authData.meta.id,
          "email": authData.meta.email,
          "avatarUrl": authData.meta.avatarUrl,
        };*/

        /* TODO FIX UPDATE */
        //await pb.collection('users').update(pb.authStore.model.id, body: data);
        final prefs = await SharedPreferences.getInstance();
        setState(() {
          isAuthenticated = true;
          prefs.setString('token', pb.authStore.token.toString());
        });

        if (mounted) {
          changePage();
        }
      }
    } catch (e) {
      debugPrint(e.toString());
    }
  }

  void changePage() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => AppView()),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: checkAuthentication(),
      builder: (BuildContext context, AsyncSnapshot<bool> snapshot) {
        if (widget.isConnected) { changePage(); }
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const CircularProgressIndicator(strokeWidth: 50);
        } else if (snapshot.hasError) {
          return Text('Error: ${snapshot.error}');
        } else {
          isAuthenticated = snapshot.data ?? false;
          return Scaffold(
            backgroundColor: widget.isDarkMode ? AppColors.backgroundDark : AppColors.backgroundLight,
            appBar: AppBar(
              backgroundColor: Colors.transparent,
              actions: [
                IconButton(
                  icon: Icon(
                    widget.isDarkMode ? Icons.wb_sunny : Icons.nightlight_round,
                    color: widget.isDarkMode ? AppColors.navBarItemDark : AppColors.navBarItemLight,
                  ),
                  onPressed: widget.toggleTheme,
                ),
              ],
            ),
            body: Stack(
              children: [
                // Votre contenu principal ici
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: <Widget>[
                      SvgPicture.asset(
                        'assets/SpotiPollLogoDark.svg',
                        semanticsLabel: 'Logo',
                        height: 200,
                        width: 60,
                      ),
                      ElevatedButton(
                        onPressed: isAuthenticated ? null : _login,
                        style: ElevatedButton.styleFrom(
                          shape: const CircleBorder(),
                          backgroundColor: AppColors.btnConnect,
                        ),
                        child: const Icon(Icons.play_arrow_rounded, color: Colors.white, size: 80),
                      ),
                    ],
                  ),
                ),
                //Positioned(
                //  top: 50, // Distance depuis le haut
                //  right: 20, // Distance depuis la droite
                //  child: FloatingActionButton(
                //    onPressed: widget.toggleTheme,
                //    child: Icon(widget.isDarkMode ? Icons.brightness_2: Icons.brightness_high),
                //  ),
                //),
              ],
            ),
          );
        }
      }
    );
  }
}

