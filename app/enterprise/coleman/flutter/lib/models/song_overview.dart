class SongOverview {
  const SongOverview({
    required this.title,
    required this.artist,
    required this.originalKey,
    required this.tempoBpm,
    required this.churchMovement,
    required this.nashvilleNumbers,
    required this.progressionLabel,
  });

  final String title;
  final String artist;
  final String originalKey;
  final int tempoBpm;
  final String churchMovement;
  final String nashvilleNumbers;
  final String progressionLabel;

  factory SongOverview.fromJson(Map<String, dynamic> json) {
    return SongOverview(
      title: json['title'] as String? ?? 'Unknown',
      artist: json['artist'] as String? ?? 'Unknown',
      originalKey: json['originalKey'] as String? ?? '—',
      tempoBpm: (json['tempoBpm'] as num?)?.toInt() ?? 0,
      churchMovement: json['churchMovement'] as String? ?? '—',
      nashvilleNumbers: json['nashvilleNumbers'] as String? ?? '—',
      progressionLabel: json['progressionLabel'] as String? ?? '',
    );
  }
}
