import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:lucide_icons/lucide_icons.dart';

// Import Views
import 'package:daf3tna/features/vibes/presentation/views/panic_view.dart';
import 'package:daf3tna/features/vibes/presentation/views/awards_view.dart';
import 'package:daf3tna/features/vibes/presentation/views/quotes_view.dart';
import 'package:daf3tna/features/vibes/presentation/views/confessions_view.dart';
import 'package:daf3tna/features/vibes/presentation/views/time_capsule_view.dart';
import 'package:daf3tna/features/vibes/presentation/views/instants_view.dart';
import 'package:daf3tna/features/vibes/presentation/views/notebooks_view.dart';
import 'package:daf3tna/features/vibes/presentation/views/games_view.dart';

class VibeDetailScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> vibe;
  const VibeDetailScreen({super.key, required this.vibe});

  @override
  ConsumerState<VibeDetailScreen> createState() => _VibeDetailScreenState();
}

class _VibeDetailScreenState extends ConsumerState<VibeDetailScreen> {
  @override
  Widget build(BuildContext context) {
    final String type = widget.vibe['id'];
    final String title = widget.vibe['title'];
    final colors = widget.vibe['colors'] as List<Color>;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: colors.first.withValues(alpha: 0.1),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowRight),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _buildVibeContent(type, colors),
    );
  }

  Widget _buildVibeContent(String type, List<Color> colors) {
    switch (type) {
      case 'panic':
        return PanicView(colors: colors);
      case 'awards':
        return AwardsView(colors: colors);
      case 'quotes':
        return QuotesView(colors: colors);
      case 'instants':
        return InstantsView(colors: colors);
      case 'notebooks':
        return NotebooksView(colors: colors);
      case 'confessions':
        return ConfessionsView(colors: colors);
      case 'time_capsule':
        return TimeCapsuleView(colors: colors);
      case 'games':
        return const GamesView();
      default:
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(LucideIcons.code, size: 64, color: Colors.white.withValues(alpha: 0.1)),
              const SizedBox(height: 16),
              const Text('قريباً في التحديث القادم...', style: TextStyle(color: Colors.white38)),
            ],
          ),
        );
    }
  }
}
