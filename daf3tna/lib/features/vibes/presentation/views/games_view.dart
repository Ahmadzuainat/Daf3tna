import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/games/presentation/views/tic_tac_toe_view.dart';

class GamesView extends ConsumerWidget {
  final List<Color> colors;
  const GamesView({super.key, required this.colors});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final List<Map<String, dynamic>> games = [
      {
        'id': 'tictactoe',
        'title': 'Tic Tac Toe (X O)',
        'desc': 'لعبة التحدي الكلاسيكية السريعة',
        'icon': LucideIcons.gamepad2,
        'color': const [Color(0xFF3B82F6), Color(0xFF1E3A8A)],
        'view': const TicTacToeView(),
      },
      {
        'id': 'chess',
        'title': 'شطرنج (Chess)',
        'desc': 'تحدى ذكاء أصدقائك في معركة الملوك',
        'icon': LucideIcons.trophy,
        'color': const [Color(0xFF10B981), Color(0xFF065F46)],
        'view': null,
      },
      {
        'id': 'ludo',
        'title': 'لودو (Ludo)',
        'desc': 'لعبة الحظ والذكاء الجماعية',
        'icon': LucideIcons.users,
        'color': const [Color(0xFFF59E0B), Color(0xFFB45309)],
        'view': null,
      }
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          _buildHeader(context),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: games.length,
              itemBuilder: (context, index) {
                final game = games[index];
                return _buildGameCard(context, game);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(top: 60, left: 20, right: 20, bottom: 30),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: colors, begin: Alignment.topLeft, end: Alignment.bottomRight),
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(LucideIcons.arrowRight, color: Colors.white, size: 30),
            onPressed: () => Navigator.pop(context),
          ),
          const SizedBox(width: 15),
          const Text(
            'الألعاب الجماعية 🎮',
            style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildGameCard(BuildContext context, Map<String, dynamic> game) {
    final bool isAvailable = game['view'] != null;
    return GestureDetector(
      onTap: () {
        if (isAvailable) {
          Navigator.push(context, MaterialPageRoute(builder: (context) => game['view']));
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 20),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: LinearGradient(colors: game['color']),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 8))],
        ),
        child: Stack(
          children: [
            Positioned(
              right: -20,
              top: 0,
              bottom: 0,
              child: Icon(game['icon'], size: 120, color: Colors.white.withOpacity(0.1)),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(game['title'], style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(game['desc'], style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 14)),
                const SizedBox(height: 16),
                if (!isAvailable)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(color: Colors.black26, borderRadius: BorderRadius.circular(10)),
                    child: const Text('قريباً...', style: TextStyle(color: Colors.white70, fontSize: 12)),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
