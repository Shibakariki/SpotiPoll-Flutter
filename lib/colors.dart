import 'package:flutter/material.dart';

final ThemeData lightTheme = ThemeData(
  colorScheme: ColorScheme(
      background: AppColors.backgroundLight,
      brightness: const ColorScheme.light().brightness,
      primary: const ColorScheme.light().primary,
      onPrimary: const ColorScheme.light().onPrimary,
      secondary: const ColorScheme.light().secondary,
      onSecondary: const ColorScheme.light().onSecondary,
      error: const ColorScheme.light().error,
      onError: const ColorScheme.light().onError,
      onBackground: const ColorScheme.light().onBackground,
      surface: const ColorScheme.light().surface,
      onSurface: const ColorScheme.light().onSurface),
);

final ThemeData darkTheme = ThemeData(
  colorScheme: ColorScheme(
      background: AppColors.backgroundDark,
      brightness: const ColorScheme.dark().brightness,
      primary: const ColorScheme.dark().primary,
      onPrimary: const ColorScheme.dark().onPrimary,
      secondary: const ColorScheme.dark().secondary,
      onSecondary: const ColorScheme.dark().onSecondary,
      error: const ColorScheme.dark().error,
      onError: const ColorScheme.dark().onError,
      onBackground: const ColorScheme.dark().onBackground,
      surface: const ColorScheme.dark().surface,
      onSurface: const ColorScheme.dark().onSurface),
);

class AppColors {
  static const Color backgroundDark = Color.fromRGBO(34, 38, 62, 1.0); //Navy blue
  static const Color backgroundLight = Color.fromRGBO(249, 231, 207, 1.0); //Cream
  static const Color navBarItemDark = Color.fromRGBO(31, 223, 100, 0.7);
  static const Color navBarItemLight = Color.fromRGBO(34,139,34, 0.7);
  static const Color navBarSelectedItemDark = Color.fromRGBO(31, 223, 100, 1.0);
  static const Color navBarSelectedItemLight = Color.fromRGBO(34,139,34, 1.0);
  static const Color greenSpotify = Color.fromRGBO(34,139,34, 1.0);
  static const Color titleDark = Colors.white;
  static const Color titleLight = Colors.black;
  static const Color subtitleDark = Color.fromRGBO(195, 195, 195, 1);
  static const Color subtitleLight = Color.fromRGBO(110,110,110, 1);
  static const Color cardButtonBackgroundDark = Color.fromRGBO(34, 38, 62, 1.0); //Navy blue
  static const Color cardButtonBackgroundLight = Color.fromRGBO(249, 231, 207, 1.0); //Cream
  static const Color cardBackgroundDark = Color.fromRGBO(34, 109, 104, 1.0);
  static const Color cardBackgroundLight = Color.fromRGBO(144,238,144, 1.0);
  static const Color spotiGreen = Color.fromRGBO(29, 185, 84, 1.0); //Vert spotify
  static const Color btnConnect = Color.fromRGBO(3, 130, 69, 1.0); //Vert spotify
  static const Color btnDisconnectDark = Color.fromRGBO(255, 0, 0, 1);
  static const Color btnDisconnectLight = Color.fromRGBO(154, 58, 55, 1);
  static const Color btnDisconnectBackgroundDark = Color.fromRGBO(255, 105, 97, 0.5);
  static const Color btnDisconnectBackgroundLight = Color.fromRGBO(255, 0, 0, 0.5);
}