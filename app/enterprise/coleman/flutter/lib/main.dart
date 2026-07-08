import 'package:flutter/material.dart';

import 'screens/coleman_dashboard.dart';

void main() => runApp(const ColemanApp());

class ColemanApp extends StatelessWidget {
  const ColemanApp({super.key});

  static const electricGreen = Color(0xff00E676);
  static const scaffoldDark = Color(0xff121212);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: scaffoldDark,
        primaryColor: electricGreen,
      ),
      home: const ColemanDashboard(),
    );
  }
}
