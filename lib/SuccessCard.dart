import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'colors.dart';

class SuccessCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final int advencement;
  final int maxAdvencement;
  final bool isDarkMode;

  SuccessCard(
      {required this.title,
      required this.subtitle,
      required this.advencement,
      required this.maxAdvencement,
      required this.isDarkMode});

  void _showDialog(BuildContext context, String title, String subtitle) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: isDarkMode
              ? AppColors.cardBackgroundDark
              : AppColors.cardBackgroundLight,
          title: Text(
            title,
            style: TextStyle(
              color: isDarkMode ? AppColors.titleDark : AppColors.titleLight,
              fontSize: 20,
            ),
          ),
          content: Text(
            subtitle,
            style: TextStyle(
              color:
                  isDarkMode ? AppColors.subtitleDark : AppColors.subtitleLight,
              fontSize: 16,
            ),
          ),
          actions: <Widget>[
            ElevatedButton(
              style: ButtonStyle(
                backgroundColor: MaterialStateProperty.resolveWith<Color>(
                  (Set<MaterialState> states) {
                    if (states.contains(MaterialState.pressed)) {
                      return isDarkMode
                          ? AppColors.cardButtonBackgroundDark
                          : AppColors
                              .cardButtonBackgroundLight; // Couleur lors de l'appui
                    } else {
                      return isDarkMode
                          ? AppColors.cardButtonBackgroundDark
                          : AppColors
                              .cardButtonBackgroundLight; // Couleur par défaut
                    }
                  },
                ),
              ),
              child: Text(
                "Fermer",
                style: TextStyle(
                  color:
                      isDarkMode ? AppColors.titleDark : AppColors.titleLight,
                  fontSize: 16,
                ),
              ),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        _showDialog(context, this.title, this.subtitle);
      },
      child: Card(
      color: isDarkMode
          ? AppColors.cardBackgroundDark
          : AppColors.cardBackgroundLight,
      // Change this color according to your design
      child: ListTile(
        leading: Icon(Icons.star),
        title: Text(
          this.title,
          style: TextStyle(
            color: isDarkMode ? AppColors.titleDark : AppColors.titleLight,
            fontSize: 16,
          ),
        ),
        subtitle: Row(
            children: [
              Expanded(
                // Utiliser Expanded ici
                child: LinearProgressIndicator(
                  value: advencement / maxAdvencement,
                  backgroundColor: isDarkMode
                      ? AppColors.subtitleLight
                      : AppColors.subtitleDark,
                  valueColor: AlwaysStoppedAnimation<Color>(isDarkMode
                      ? AppColors.navBarSelectedItemDark
                      : AppColors.navBarSelectedItemLight),
                ),
              ),
              Padding(
                padding: EdgeInsets.only(left: 15),
                child: Text(
                  "$advencement/$maxAdvencement",
                  style: TextStyle(
                    color: isDarkMode
                        ? AppColors.subtitleDark
                        : AppColors.subtitleLight,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
