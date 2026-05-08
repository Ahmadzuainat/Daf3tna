import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/feed/presentation/notifications_screen.dart';
import 'package:daf3tna/features/feed/presentation/chat_list_screen.dart';

class CustomAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String? title;
  final bool showLogo;

  const CustomAppBar({
    super.key,
    this.title,
    this.showLogo = true,
  });

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: AppColors.background.withOpacity(0.8),
      elevation: 0,
      centerTitle: true,
      leading: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Container(
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            gradient: AppColors.primaryGradient,
          ),
          child: const Center(
            child: Text(
              'D',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
          ),
        ),
      ),
      title: Column(
        children: [
          const Text(
            'دفعتنا',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          Text(
            'AL AL-BAYT UNIVERSITY',
            style: TextStyle(
              fontSize: 10,
              color: Colors.white.withOpacity(0.5),
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
      actions: [
        Stack(
          children: [
            IconButton(
              icon: const Icon(LucideIcons.bell, color: Colors.white, size: 22),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const NotificationsScreen()),
                );
              },
            ),
            Positioned(
              top: 10,
              right: 10,
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: AppColors.error,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.background, width: 1.5),
                ),
                constraints: const BoxConstraints(minWidth: 14, minHeight: 14),
                child: const Text(
                  '1',
                  style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ],
        ),
        IconButton(
          icon: const Icon(LucideIcons.send, color: Colors.white, size: 22),
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const ChatListScreen()),
            );
          },
        ),
        const Padding(
          padding: EdgeInsets.only(right: 12, left: 4),
          child: CircleAvatar(
            radius: 16,
            backgroundImage: CachedNetworkImageProvider('https://via.placeholder.com/150'),
          ),
        ),
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight + 10);
}
