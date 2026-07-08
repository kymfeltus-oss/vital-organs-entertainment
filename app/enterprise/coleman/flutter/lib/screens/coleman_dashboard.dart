import 'package:flutter/material.dart';

import '../models/song_overview.dart';
import '../services/pitch_detection_service.dart';
import '../services/shazam_service.dart';
import '../widgets/song_overview_sheet.dart';

class ColemanDashboard extends StatefulWidget {
  const ColemanDashboard({super.key});

  @override
  State<ColemanDashboard> createState() => _ColemanDashboardState();
}

class _ColemanDashboardState extends State<ColemanDashboard> {
  static const electricGreen = Color(0xff00E676);
  static const shazamBlue = Color(0xff2979FF);

  final PitchDetectionService _pitchService = PitchDetectionService();
  final ShazamService _shazamService = ShazamService();

  bool isPreacherMode = true;
  bool isListening = false;
  String currentNote = 'Ab';
  String currentKey = 'Ab Major';
  double tuningOffset = 0.45;
  bool isRecognizing = false;

  @override
  void initState() {
    super.initState();
    _pitchService.onPitchUpdate = (note, key, offset) {
      if (!mounted) return;
      setState(() {
        currentNote = note;
        currentKey = key;
        tuningOffset = offset;
      });
    };
  }

  @override
  void dispose() {
    _pitchService.dispose();
    super.dispose();
  }

  Future<void> _toggleListening() async {
    if (isListening) {
      await _pitchService.stop();
    } else {
      await _pitchService.start(isPreacherMode: isPreacherMode);
    }
    setState(() => isListening = !isListening);
  }

  Future<void> _triggerShazam() async {
    if (isRecognizing) return;
    setState(() => isRecognizing = true);

    try {
      final SongOverview overview = await _shazamService.recognize();
      if (!mounted) return;
      await showModalBottomSheet<void>(
        context: context,
        backgroundColor: const Color(0xff1A1A1A),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        builder: (context) => SongOverviewSheet(overview: overview),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Recognition failed: $error')),
      );
    } finally {
      if (mounted) setState(() => isRecognizing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.sizeOf(context).width;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'COLEMAN // TUNER',
          style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 2),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings, color: Colors.white60),
            onPressed: () {},
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _ModeSelector(
              isPreacherMode: isPreacherMode,
              onChanged: (preacher) {
                setState(() => isPreacherMode = preacher);
                if (isListening) {
                  _pitchService.setMode(isPreacherMode: preacher);
                }
              },
            ),
            const SizedBox(height: 40),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    currentNote,
                    style: const TextStyle(
                      fontSize: 120,
                      fontWeight: FontWeight.w900,
                      color: electricGreen,
                    ),
                  ),
                  Text(
                    'Detected Key: $currentKey',
                    style: const TextStyle(
                      fontSize: 18,
                      color: Colors.white70,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(height: 30),
                  Container(
                    height: 8,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.white10,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        Container(
                          width: 4,
                          height: 20,
                          color: Colors.white38,
                        ),
                        Positioned(
                          left: screenWidth * tuningOffset.clamp(0.05, 0.9),
                          child: Container(
                            width: 12,
                            height: 12,
                            decoration: const BoxDecoration(
                              color: electricGreen,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Padding(
                    padding: EdgeInsets.only(top: 8),
                    child: Text(
                      'FLAT             |             SHARP',
                      style: TextStyle(color: Colors.white38, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),
            const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'HISTORY: ',
                  style: TextStyle(
                    color: Colors.white38,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Fm7  ->  Bbm7  ->  Eb7  ->  ',
                  style: TextStyle(color: Colors.white60, fontSize: 12),
                ),
                Text(
                  'Ab',
                  style: TextStyle(
                    color: electricGreen,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 30),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor:
                          isListening ? Colors.redAccent : const Color(0xff1E1E1E),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    icon: Icon(
                      isListening ? Icons.mic : Icons.mic_none,
                      color: Colors.white,
                    ),
                    label: Text(
                      isListening ? 'STOP LISTENING' : 'START LIVE MIC',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    onPressed: _toggleListening,
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  decoration: BoxDecoration(
                    color: shazamBlue,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: IconButton(
                    iconSize: 32,
                    padding: const EdgeInsets.all(12),
                    icon: isRecognizing
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.center_focus_weak, color: Colors.white),
                    onPressed: _triggerShazam,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ModeSelector extends StatelessWidget {
  const _ModeSelector({
    required this.isPreacherMode,
    required this.onChanged,
  });

  final bool isPreacherMode;
  final ValueChanged<bool> onChanged;

  static const electricGreen = Color(0xff00E676);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white10,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => onChanged(true),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: isPreacherMode ? electricGreen : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'PREACHER MODE',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: isPreacherMode ? Colors.black : Colors.white60,
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => onChanged(false),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: !isPreacherMode ? electricGreen : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'SINGER MODE',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: !isPreacherMode ? Colors.black : Colors.white60,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
