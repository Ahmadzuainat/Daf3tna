import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/models/post_model.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:intl/intl.dart';
import 'package:daf3tna/core/widgets/shimmer_loading.dart';
import 'package:flutter/services.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart';
import 'package:daf3tna/features/feed/data/social_repository.dart';
import 'package:daf3tna/features/feed/data/feed_repository.dart';
import 'package:daf3tna/features/feed/providers/feed_provider.dart';
import 'package:daf3tna/features/profile/presentation/profile_screen.dart';
import 'package:glassmorphism/glassmorphism.dart';
import 'package:daf3tna/core/utils/image_utils.dart';

class PostCard extends StatelessWidget {
  final PostModel post;

  const PostCard({super.key, required this.post});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B).withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _PostHeader(user: post.user, postId: post.id, isAnonymous: post.isAnonymous),
            if (post.mediaUrls.isNotEmpty) _PostMedia(url: post.mediaUrls.first),
            IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Spacer(),
                  Expanded(
                    flex: 20,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          _PostContent(text: post.text),
                          const SizedBox(height: 12),
                          _PostActions(post: post),
                        ],
                      ),
                    ),
                  ),
                  // The Vertical Line Accent (Gradient)
                  Container(
                    width: 4,
                    margin: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Color(0xFF3B82F6), Color(0xFF8B5CF6)],
                      ),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PostHeader extends ConsumerWidget {
  final dynamic user;
  final String postId;
  final bool isAnonymous;
  const _PostHeader({required this.user, required this.postId, this.isAnonymous = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.02),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          _PostOptions(postId: postId),
          const Spacer(),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                isAnonymous ? 'مجهول' : user.fullName,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  letterSpacing: 0.3,
                ),
              ),
              const Text(
                'الآن', // Simplified time like web grid
                style: TextStyle(color: AppColors.textDim, fontSize: 10),
              ),
            ],
          ),
          const SizedBox(width: 10),
          GestureDetector(
            onTap: isAnonymous ? null : () => Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => ProfileScreen(username: user.username)),
            ),
            child: Container(
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: isAnonymous 
                    ? [const Color(0xFFD946EF), const Color(0xFF701A75)] // Ghost gradient
                    : [const Color(0xFF3B82F6), const Color(0xFF8B5CF6)],
                ),
              ),
              child: isAnonymous 
                ? const CircleAvatar(
                    radius: 14,
                    backgroundColor: Color(0xFF1E293B),
                    child: Icon(LucideIcons.ghost, size: 14, color: Colors.white),
                  )
                : CircleAvatar(
                    radius: 14,
                    backgroundColor: const Color(0xFF1E293B),
                    backgroundImage: CachedNetworkImageProvider(ImageUtils.getOptimizedUrl(user.avatarUrl, width: 100)),
                  ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PostOptions extends ConsumerWidget {
  final String postId;
  const _PostOptions({required this.postId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final isAdmin = ['superadmin', 'admin', 'moderator'].contains(user?.role);
    // For isOwner, we'd need the post owner id. Let's just focus on admin for now as requested.
    
    if (!isAdmin) return const Icon(LucideIcons.moreVertical, color: AppColors.textDim, size: 18);

    return PopupMenuButton<String>(
      icon: const Icon(LucideIcons.moreVertical, color: AppColors.textDim, size: 18),
      color: AppColors.surface,
      onSelected: (value) async {
        if (value == 'delete') {
          final confirmed = await showDialog<bool>(
            context: context,
            builder: (context) => AlertDialog(
              backgroundColor: AppColors.surface,
              title: const Text('حذف المنشور', style: TextStyle(color: Colors.white)),
              content: const Text('هل أنت متأكد من حذف هذا المنشور؟', style: TextStyle(color: Colors.white70)),
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
              await ref.read(feedRepositoryProvider).deletePost(postId);
              ref.read(feedProvider.notifier).fetchPosts();
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم حذف المنشور')));
            } catch (_) {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('فشل حذف المنشور')));
            }
          }
        }
      },
      itemBuilder: (context) => [
        const PopupMenuItem(
          value: 'delete',
          child: Row(
            children: [
              Icon(LucideIcons.trash2, color: Colors.redAccent, size: 18),
              SizedBox(width: 8),
              Text('حذف', style: TextStyle(color: Colors.redAccent)),
            ],
          ),
        ),
      ],
    );
  }
}

class _PostContent extends StatelessWidget {
  final String text;
  const _PostContent({required this.text});

  @override
  Widget build(BuildContext context) {
    if (text.isEmpty) return const SizedBox.shrink();
    return Text(
      text,
      style: TextStyle(
        color: Colors.white.withValues(alpha: 0.9),
        fontSize: 13, // 0.8rem approx
        height: 1.5,
        fontWeight: FontWeight.w400,
      ),
      textAlign: TextAlign.right,
      maxLines: 3,
      overflow: TextOverflow.ellipsis,
    );
  }
}

class _PostMedia extends StatelessWidget {
  final String url;
  const _PostMedia({required this.url});

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 1, // Square like web template
      child: CachedNetworkImage(
        imageUrl: ImageUtils.getOptimizedUrl(url, width: 800),
        memCacheWidth: 800,
        placeholder: (context, url) => const ShimmerLoading.rectangular(height: 300),
        errorWidget: (context, url, error) => const Icon(LucideIcons.image),
        fit: BoxFit.cover,
      ),
    );
  }
}

class _PostActions extends ConsumerStatefulWidget {
  final PostModel post;
  const _PostActions({required this.post});

  @override
  ConsumerState<_PostActions> createState() => _PostActionsState();
}

class _PostActionsState extends ConsumerState<_PostActions> {
  bool? _isLikedLocal;
  int? _likesCountLocal;

  @override
  Widget build(BuildContext context) {
    final currentUser = ref.watch(currentUserProvider);
    final isLiked = _isLikedLocal ?? widget.post.likes.contains(currentUser?.id);
    final likesCount = _likesCountLocal ?? widget.post.likes.length;

    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        const Icon(LucideIcons.send, color: Colors.white24, size: 16),
        const Spacer(),
        _ActionItem(
          icon: LucideIcons.messageCircle,
          label: widget.post.commentsCount.toString(),
          color: widget.post.commentsCount > 0 ? Colors.white : Colors.white.withValues(alpha: 0.6),
          onTap: () {},
        ),
        const SizedBox(width: 16),
        _ActionItem(
          icon: LucideIcons.heart,
          label: likesCount.toString(),
          color: isLiked ? const Color(0xFFEF4444) : Colors.white.withValues(alpha: 0.6),
          isFilled: isLiked,
          onTap: () async {
            final repo = ref.read(socialRepositoryProvider);
            
            setState(() {
              _isLikedLocal = !isLiked;
              _likesCountLocal = isLiked ? (likesCount - 1) : (likesCount + 1);
            });

            try {
              await repo.toggleLike(widget.post.id);
              // Background refresh if needed, but UI is already updated
            } catch (e) {
              // Revert on error
              setState(() {
                _isLikedLocal = isLiked;
                _likesCountLocal = likesCount;
              });
            }
          },
        ),
      ],
    );
  }
}

class _ActionItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final bool isFilled;
  final VoidCallback onTap;

  const _ActionItem({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
    this.isFilled = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Row(
        children: [
          Text(
            label,
            style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w600),
          ),
          const SizedBox(width: 6),
          Icon(
            icon,
            size: 18,
            color: color,
            fill: isFilled ? 1.0 : 0.0,
          ),
        ],
      ),
    );
  }
}
