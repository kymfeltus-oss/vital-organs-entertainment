import 'package:flutter/material.dart';

import '../models/song_overview.dart';

class SongOverviewSheet extends StatelessWidget {
  const SongOverviewSheet({super.key, required this.overview});

  final SongOverview overview;

  static const electricGreen = Color(0xff00E676);
  static const shazamBlue = Color(0xff2979FF);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.music_note, color: shazamBlue),
              SizedBox(width: 8),
              Text(
                'MATCH FOUND VIA SHAZAM',
                style: TextStyle(
                  color: shazamBlue,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            overview.title,
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          Text(
            overview.artist,
            style: const TextStyle(fontSize: 16, color: Colors.white60),
          ),
          const Divider(height: 32, color: Colors.white10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _MetricColumn(
                label: 'ORIGINAL KEY',
                value: overview.originalKey,
                valueColor: electricGreen,
              ),
              _MetricColumn(
                label: 'TEMPO',
                value: '${overview.tempoBpm} BPM',
              ),
              _MetricColumn(
                label: 'CHURCH MOVEMENT',
                value: overview.churchMovement,
                valueColor: Colors.amber,
              ),
            ],
          ),
          const SizedBox(height: 24),
          const Text(
            'NASHVILLE NUMBER SYSTEM',
            style: TextStyle(
              color: Colors.white38,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white10,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '${overview.nashvilleNumbers}\n(${overview.progressionLabel})',
              style: const TextStyle(
                fontSize: 18,
                fontFamily: 'monospace',
                fontWeight: FontWeight.bold,
                letterSpacing: 2,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

class _MetricColumn extends StatelessWidget {
  const _MetricColumn({
    required this.label,
    required this.value,
    this.valueColor,
  });

  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(color: Colors.white38, fontSize: 11),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: valueColor ?? Colors.white,
          ),
        ),
      ],
    );
  }
}
