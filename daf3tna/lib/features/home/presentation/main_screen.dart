import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/feed/presentation/feed_screen.dart';
import 'package:daf3tna/features/profile/presentation/profile_screen.dart';
import 'package:daf3tna/core/widgets/custom_app_bar.dart';

import 'package:daf3tna/features/hubs/presentation/hubs_screen.dart';

import 'package:daf3tna/features/search/presentation/search_screen.dart';

import 'package:daf3tna/features/yearbook/presentation/yearbook_screen.dart';

import 'package:daf3tna/features/vibes/presentation/vibes_screen.dart';

class MainScreen extends ConsumerStatefulWidget {
  const MainScreen({super.key});

  @override
  ConsumerState<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends ConsumerState<MainScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const FeedScreen(),
    const SearchScreen(),
    const HubsScreen(),
    const VibesScreen(),
    const YearbookScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const CustomAppBar(),
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: Colors.white.withOpacity(0.05))),
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: (index) => setState(() => _selectedIndex = index),
          type: BottomNavigationBarType.fixed,
          backgroundColor: AppColors.background,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.textMuted,
          showSelectedLabels: false,
          showUnselectedLabels: false,
          items: const [
            BottomNavigationBarItem(icon: Icon(LucideIcons.home), label: 'الرئيسية'),
            BottomNavigationBarItem(icon: Icon(LucideIcons.search), label: 'البحث'),
            BottomNavigationBarItem(icon: Icon(LucideIcons.plusSquare), label: 'المجتمعات'),
            BottomNavigationBarItem(icon: Icon(LucideIcons.flame), label: 'الفعاليات'),
            BottomNavigationBarItem(icon: Icon(LucideIcons.bookOpen), label: 'كتاب السنة'),
            BottomNavigationBarItem(icon: Icon(LucideIcons.user), label: 'الملف الشخصي'),
          ],
        ),
      ),
    );
  }
}

class _PlaceholderScreen extends StatelessWidget {
  final String title;
  final IconData icon;

  const _PlaceholderScreen({required this.title, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: AppColors.textMuted),
          const SizedBox(height: 16),
          Text(title, style: const TextStyle(fontSize: 20, color: AppColors.textDim)),
        ],
      ),
    );
  }
}
