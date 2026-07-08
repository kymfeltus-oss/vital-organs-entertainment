import 'dart:async';

/// Live pitch detection — wire to platform audio (AudioKit on iOS, Oboe/FFT on Android).
///
/// Architecture:
///   Microphone → PCM samples → FFT / YIN pitch tracker → note + cents offset → UI
class PitchDetectionService {
  Timer? _simulationTimer;
  bool _isPreacherMode = true;

  void Function(String note, String key, double offset)? onPitchUpdate;

  Future<void> start({required bool isPreacherMode}) async {
    _isPreacherMode = isPreacherMode;
    _simulationTimer?.cancel();

    // TODO: Replace simulation with record package + native FFT bridge.
    _simulationTimer = Timer.periodic(const Duration(milliseconds: 400), (_) {
      onPitchUpdate?.call('Ab', 'Ab Major', 0.45 + (_isPreacherMode ? 0 : 0.02));
    });
  }

  Future<void> stop() async {
    _simulationTimer?.cancel();
    _simulationTimer = null;
  }

  void setMode({required bool isPreacherMode}) {
    _isPreacherMode = isPreacherMode;
  }

  void dispose() {
    _simulationTimer?.cancel();
  }
}
