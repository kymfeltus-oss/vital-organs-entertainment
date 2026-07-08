import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/song_overview.dart';

/// Calls the Coleman Node.js API for ShazamKit / ACRCloud song recognition.
class ShazamService {
  ShazamService({this.baseUrl = 'http://localhost:4780'});

  final String baseUrl;

  Future<SongOverview> recognize({List<int>? audioSample}) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/recognize'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        if (audioSample != null) 'audioSample': base64Encode(audioSample),
      }),
    );

    if (response.statusCode != 200) {
      throw Exception('Recognition API returned ${response.statusCode}');
    }

    return SongOverview.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }
}
