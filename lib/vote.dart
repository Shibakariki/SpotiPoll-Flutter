import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:pocketbase/pocketbase.dart';
import 'package:http/http.dart' as http;

import 'GlowingVoteButtons.dart';
import 'customIcons.dart';

class VoteScreenBuilder {
  Widget buildVoteScreen(PocketBase pb, bool isDarkMode) {
    return FutureBuilder<List<RecordModel>>(
        future: pb.collection('users').getFullList(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          } else if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          } else if (snapshot.hasData) {
            final username = snapshot.data!.isNotEmpty
                ? snapshot.data![0].toJson()['name'] ?? 'No Name'
                : 'No Users';

            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                  Card(),
                  GlowingVoteButtons(pb: pb),
                ],
              ),
            );
          } else {
            return const Center(child: Text('No data available'));
          }
        });
  }
}
