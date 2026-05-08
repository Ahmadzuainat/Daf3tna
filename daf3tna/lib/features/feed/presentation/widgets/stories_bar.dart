import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:daf3tna/core/theme/app_theme.dart';

import 'package:daf3tna/features/feed/data/social_repository.dart';
import 'package:daf3tna/models/social_models.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:daf3tna/core/widgets/shimmer_loading.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart';

final storiesProvider = FutureProvider<List<StoryModel>>((ref) {
  return ref.read(socialRepositoryProvider).fetchStories();
});

class StoriesBar extends ConsumerWidget {
  const StoriesBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final storiesAsync = ref.watch(storiesProvider);

    return Container(
      height: 120,
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: storiesAsync.when(
        data: (stories) => ListView.builder(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: stories.length + 1,
          itemBuilder: (context, index) {
            if (index == 0) return const _AddStoryItem();
            return _StoryCircle(story: stories[index - 1]);
          },
        ),
        loading: () => ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: 5,
          itemBuilder: (context, index) => const Padding(
            padding: EdgeInsets.only(left: 12),
            child: ShimmerLoading.circular(width: 75, height: 75),
          ),
        ),
        error: (err, stack) => const Center(
          child: Icon(LucideIcons.alertCircle, color: Colors.white10),
        ),
      ),
    );
  }
}

class _AddStoryItem extends StatelessWidget {
  const _AddStoryItem();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: Column(
        children: [
          Container(
            width: 84,
            height: 84,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withOpacity(0.02),
              border: Border.all(
                color: Colors.white.withOpacity(0.1),
                width: 2,
              ),
            ),
            child: const Center(
              child: Icon(LucideIcons.plus, color: Colors.white, size: 32),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'إضافة قصة',
            style: TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}

class _StoryCircle extends ConsumerWidget {
  final StoryModel story;
  const _StoryCircle({required this.story});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Check if viewed (simplified logic for UI match)
    const bool isViewed = false; 
    final user = ref.watch(currentUserProvider);
    final isAdmin = ['superadmin', 'admin', 'moderator'].contains(user?.role);
    final isOwner = story.user.id == user?.id;

    return GestureDetector(
      onLongPress: (isAdmin || isOwner) ? () => _handleDelete(context, ref) : null,
      child: Padding(
        padding: const EdgeInsets.only(right: 12),
        child: Column(
          children: [
            Container(
              width: 84,
              height: 84,
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: !isViewed 
                  ? const LinearGradient(
                      colors: [Color(0xFFF59E0B), Color(0xFFEF4444), Color(0xFFD946EF)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    )
                  : null,
                color: isViewed ? Colors.white.withOpacity(0.2) : null,
              ),
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFF0A0F1C), // Matching deep dark theme
                ),
                child: CircleAvatar(
                  radius: 38,
                  backgroundColor: AppColors.surface,
                  backgroundImage: CachedNetworkImageProvider(story.user.avatarUrl ?? ''),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              story.user.fullName.split(' ')[0],
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }

  void _handleDelete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('حذف القصة', style: TextStyle(color: Colors.white)),
        content: const Text('هل أنت متأكد من حذف هذه القصة؟', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('إلغاء')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('حذف', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await ref.read(socialRepositoryProvider).deleteStory(story.id);
        ref.invalidate(storiesProvider);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم حذف القصة')));
      } catch (_) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('فشل حذف القصة')));
      }
    }
  }
}
