import 'package:flutter/material.dart';
import 'package:flutter_glow/flutter_glow.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:my_app/colors.dart';
import 'package:my_app/customIcons.dart';
import 'package:pocketbase/pocketbase.dart';
import 'package:http/http.dart' as http;

class GlowingVoteButtons extends StatefulWidget {
  final PocketBase pb;

  const GlowingVoteButtons({super.key, required this.pb});

  @override
  _GlowingVoteButtonsState createState() => _GlowingVoteButtonsState(pb);
}

class _GlowingVoteButtonsState extends State<GlowingVoteButtons> {
  bool like = false;
  bool unlike = false;
  PocketBase pb;

  _GlowingVoteButtonsState(this.pb);

  Future<int> checkVote() async {
    try {
      // Call PocketBase to get the collection of votes
      List<RecordModel> votesData = await fetchVoteData();
      List<RecordModel> userData = await fetchUserData();
      String userId = userData[0].toJson()["id"];
      DateTime now = DateTime.now().add(const Duration(hours: 1));
      var voteValue = votesData
          .where((vote) {
            return vote.toJson()["user_id"] == userId && DateTime.parse(vote.toJson()["created"]).day == now.day && DateTime.parse(vote.toJson()["created"]).month == now.month && DateTime.parse(vote.toJson()["created"]).year == now.year;
          })
          .toList();
      if (voteValue.length > 0) {
        return voteValue[0].toJson()["vote_answer"];
      }
      return 0;
    } catch (e) {
      print('Error while fetching votes: $e');
      return 0;
    }
  }

  @override
  void initState() {
    super.initState();
    // Call checkVote to determine the initial state of the icon
    checkVote().then((result) {
      setState(() {
        if (result != 0){
          like = result == 1 ? true : false;
          unlike = !like;
        }
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.max,
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: <Widget>[
        GestureDetector(
          onTap: () async {
            await _vote("1", pb);
            int voteValue = await checkVote();
            if (voteValue != 0){
              // Toggle the icon state
              setState(() {
                like = voteValue == 1 ? true : false;
                unlike = !like;
              });
            }
          },
          child: GlowIcon(
            like
                ? CustomIcons.like_fill
                : CustomIcons.like_empty,
            color: AppColors.spotiGreen,
            glowColor: AppColors.spotiGreen,
            size: 64,
            blurRadius: 9,
          ),
        ),

        GestureDetector(
          onTap: () async {
            await _vote("-1", pb);
            int voteValue = await checkVote();
            if (voteValue != 0){
              // Toggle the icon state
              setState(() {
                like = voteValue == 1 ? true : false;
                unlike = !like;
              });
            }
          },
          child: GlowIcon(
            unlike
                ? CustomIcons.unlike_fill
                : CustomIcons.unlike_empty,
            color: AppColors.spotiGreen,
            glowColor: AppColors.spotiGreen,
            size: 64,
            blurRadius: 9,
          ),
        ),
      ],
    );
  }

  // Function to fetch data from PocketBase
  Future<List<RecordModel>> fetchVoteData() async {
    try {
      return await pb.collection('Vote').getFullList(sort: '-created');
      // You can use votesData as needed, or perform additional logic with it
    } catch (e) {
      print('Error while fetching votes: $e');
      rethrow; // Rethrow the exception to propagate it to the caller
    }
  }

  Future<List<RecordModel>> fetchUserData() async {
    try {
      return await pb.collection('users').getFullList();
    } catch (e) {
      print('Error while fetching votes: $e');
      rethrow; // Rethrow the exception to propagate it to the caller
    }
  }
}

// Function to launch URL
Future<void> _vote(String value, PocketBase pbClient) async {
  if (value != '1' && value != '-1') {
    throw 'Invalid value';
  }

  final url = Uri.parse('https://mennessi.iiens.net/vote?vote=$value');

  try {
    // Check if the user is authenticated
    if (!pbClient.authStore.isValid) {
      throw 'User not authenticated';
    }

    final response = await http.get(url, headers: {
      'Authorization': 'Bearer ${pbClient.authStore.token}',
      'cookie': 'pb_auth={"token":"${pbClient.authStore.token}"}'
    });

    if (response.statusCode == 200) {
      //print('Vote successful: ${response.body}');
    } else {
      print('Vote failed with status code: ${response.statusCode}');
    }
  } catch (e) {
    print('Error occurred while sending vote: $e');
  }
}
