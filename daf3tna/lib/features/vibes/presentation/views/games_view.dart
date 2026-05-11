import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/core/network/socket_service.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart';
import 'package:daf3tna/features/games/presentation/views/tic_tac_toe_view.dart';
import 'package:daf3tna/features/games/presentation/views/chess_view.dart';

class GamesView extends ConsumerStatefulWidget {
  const GamesView({super.key});

  @override
  ConsumerState<GamesView> createState() => _GamesViewState();
}

class _GamesViewState extends ConsumerState<GamesView> {
  @override
  void initState() {
    super.initState();
    // Initialize socket when entering games section
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(socketServiceProvider).connect();
    });
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const SizedBox(height: 20),
            _gameCard(
              context, 
              'Tic Tac Toe', 
              'العب X/O مع أصدقائك أو ضد الكمبيوتر', 
              LucideIcons.xCircle, 
              Colors.orange, 
              () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TicTacToeView()))
            ),
            const SizedBox(height: 16),
            _gameCard(
              context, 
              'Chess (شطرنج)', 
              'تحدى ذكاء أصدقائك في معركة الملوك', 
              LucideIcons.trophy, 
              Colors.green, 
              () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChessView()))
            ),
            const SizedBox(height: 16),
             _gameCard(
              context, 
              'Ludo (قريباً)', 
              'لعبة الزهر الكلاسيكية بمشاركة 4 لاعبين', 
              LucideIcons.gamepad2, 
              Colors.blue, 
              () {}
            ),
          ],
        ),
      ),
    );
  }

  Widget _gameCard(BuildContext context, String title, String desc, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [color.withOpacity(0.8), color.withOpacity(0.4)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [BoxShadow(color: color.withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 5))],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16)),
              child: Icon(icon, color: Colors.white, size: 32),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(desc, style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 13)),
                ],
              ),
            ),
            const Icon(LucideIcons.chevronLeft, color: Colors.white),
          ],
        ),
      ),
    );
  }
}
