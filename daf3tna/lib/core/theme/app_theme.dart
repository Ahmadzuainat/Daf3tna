import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const primary = Color(0xFF00D1FF); // Neon Cyan
  static const secondary = Color(0xFF9D50FF); // Neon Purple
  static const accent = Color(0xFF00FF9D); // Neon Green
  
  static const background = Color(0xFF0B0F1A); // Deep Navy Black
  static const surface = Color(0xFF161B2C); // Dark Navy Surface
  static const surfaceLight = Color(0xFF23293F); // Lighter Navy
  static const card = Color(0xFF1E2538); // Card background

  static const text = Color(0xFFFFFFFF);
  static const textDim = Color(0xFF94A3B8);
  static const textMuted = Color(0xFF64748B);
  
  static const success = Color(0xFF22C55E);
  static const error = Color(0xFFEF4444);
  static const warning = Color(0xFFF59E0B);

  static const primaryGradient = LinearGradient(
    colors: [Color(0xFF00D1FF), Color(0xFF0077FF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const hubGradients = [
    LinearGradient(colors: [Color(0xFFFBBF24), Color(0xFFF59E0B)]), // Programming
    LinearGradient(colors: [Color(0xFFF87171), Color(0xFFEF4444)]), // Games
    LinearGradient(colors: [Color(0xFFF472B6), Color(0xFFEC4899)]), // Design
  ];
}

class AppTheme {
  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.background,
      primaryColor: AppColors.primary,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primary,
        secondary: AppColors.secondary,
        surface: AppColors.surface,
        error: AppColors.error,
      ),
      textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme).copyWith(
        displayLarge: GoogleFonts.outfit(
          color: AppColors.text,
          fontWeight: FontWeight.bold,
        ),
        bodyLarge: GoogleFonts.outfit(
          color: AppColors.text,
        ),
        bodyMedium: GoogleFonts.outfit(
          color: AppColors.textDim,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
    );
  }
}
