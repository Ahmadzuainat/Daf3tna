import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/models/user_model.dart';
import 'package:daf3tna/models/post_model.dart';

import 'package:daf3tna/features/profile/data/profile_repository.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart';
import 'package:daf3tna/features/feed/presentation/widgets/post_card.dart';
import 'package:daf3tna/features/profile/presentation/edit_profile_screen.dart';
import 'package:daf3tna/features/profile/presentation/settings_screen.dart';

final profileProvider = FutureProvider.family<UserModel, String?>((ref, username) async {
  if (username == null) {
    // If no username, return current user (fallback to fetching if needed)
    final current = ref.read(currentUserProvider);
    if (current != null) return current;
    // Fallback logic to get own profile if state is lost
    final response = await ref.read(profileRepositoryProvider).getProfile('me'); // Assuming 'me' endpoint or similar
    return response;
  }
  return ref.read(profileRepositoryProvider).getProfile(username);
});

final userPostsProvider = FutureProvider.family<List<PostModel>, String>((ref, userId) async {
  final data = await ref.read(profileRepositoryProvider).getUserPosts(userId);
  return data.map((p) => PostModel.fromJson(p)).toList();
});

class ProfileScreen extends ConsumerWidget {
  final String? username;
  const ProfileScreen({super.key, this.username});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileProvider(username));

    return Scaffold(
      backgroundColor: AppColors.background,
      body: profileAsync.when(
        data: (user) {
          final postsAsync = ref.watch(userPostsProvider(user.id));
          return RefreshIndicator(
            onRefresh: () => ref.refresh(profileProvider(username).future),
            child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Header: Cover + Avatar (RTL)
                    Stack(
                      clipBehavior: Clip.none,
                      children: [
                        // Cover Photo (Optimized Caching)
                        CachedNetworkImage(
                          imageUrl: user.coverUrl ?? 'https://res.cloudinary.com/ahmadzt/image/upload/v1/covers/default_cover.jpg',
                          height: 220,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          memCacheHeight: 440, // Optimization: Limit memory usage
                          placeholder: (context, url) => Container(color: AppColors.surface),
                          errorWidget: (context, url, error) => Container(
                            color: AppColors.surface,
                            child: const Center(child: Icon(LucideIcons.image, color: Colors.white24, size: 40)),
                          ),
                        ),
                        
                        // Avatar Positioned to the RIGHT (RTL)
                        Positioned(
                          bottom: -50,
                          right: 20,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: AppColors.background,
                              shape: BoxShape.circle,
                            ),
                            child: CircleAvatar(
                              radius: 55,
                              backgroundColor: AppColors.surface,
                              backgroundImage: CachedNetworkImageProvider(
                                user.avatarUrl ?? 'https://via.placeholder.com/150',
                                maxWidth: 220, // Optimization
                                maxHeight: 220, // Optimization
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Actions Row
                    Padding(
                      padding: const EdgeInsets.only(right: 140, left: 16),
                      child: Row(
                        children: [
                          if (username == null || username == ref.read(currentUserProvider)?.username)
                            _buildActionButton('تعديل الملف', LucideIcons.user, isPrimary: true, onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (context) => EditProfileScreen(user: user)),
                              );
                            })
                          else
                            _buildActionButton('متابعة', LucideIcons.userPlus, isPrimary: true, onTap: () {}),
                          const SizedBox(width: 8),
                          InkWell(
                            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const SettingsScreen())),
                            child: _buildIconAction(LucideIcons.settings),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // User Info (RTL)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            user.fullName,
                            style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          Text(
                            '@${user.username}',
                            style: const TextStyle(color: AppColors.primary, fontSize: 16, fontWeight: FontWeight.w500),
                          ),
                          const SizedBox(height: 12),
                          if (user.bio != null)
                            Text(
                              user.bio!,
                              textAlign: TextAlign.right,
                              style: const TextStyle(color: AppColors.textDim, fontSize: 15, height: 1.5),
                            ),
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: AppColors.primary.withOpacity(0.2)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(user.batchId, style: const TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.bold)),
                                const SizedBox(width: 8),
                                const Icon(LucideIcons.graduationCap, size: 14, color: AppColors.primary),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Stats Bar
                    Container(
                      margin: const EdgeInsets.symmetric(horizontal: 20),
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: Colors.white.withOpacity(0.05)),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          postsAsync.when(
                            data: (posts) => _buildStat(posts.length.toString(), 'منشور'),
                            loading: () => _buildStat('-', 'منشور'),
                            error: (_, __) => _buildStat('0', 'منشور'),
                          ),
                          _buildStat(user.followers.length.toString(), 'متابع'),
                          _buildStat(user.following.length.toString(), 'يتابع'),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),
                    
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 20),
                      child: Text(
                        'المنشورات',
                        textAlign: TextAlign.right,
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                    
                    const SizedBox(height: 16),
                  ],
                ),
              ),
              
              // Posts List
              postsAsync.when(
                data: (posts) {
                  if (posts.isEmpty) {
                    return const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.all(40),
                        child: Center(child: Text('لا توجد منشورات بعد', style: TextStyle(color: AppColors.textDim))),
                      ),
                    );
                  }
                  return SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => PostCard(post: posts[index]),
                      childCount: posts.length,
                    ),
                  );
                },
                loading: () => const SliverToBoxAdapter(child: Center(child: CircularProgressIndicator())),
                error: (err, _) => SliverToBoxAdapter(child: Center(child: Text('Error: $err'))),
              ),
            ],
          ),
        );
      },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.white))),
      ),
    );
  }

  Widget _buildActionButton(String label, IconData icon, {bool isPrimary = false, VoidCallback? onTap}) {
    return Expanded(
      child: Container(
        height: 44,
        decoration: BoxDecoration(
          gradient: isPrimary ? AppColors.primaryGradient : null,
          color: isPrimary ? null : AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: isPrimary ? null : Border.all(color: Colors.white10),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
              const SizedBox(width: 8),
              Icon(icon, color: Colors.white, size: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildIconAction(IconData icon) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white10),
      ),
      child: Icon(icon, color: Colors.white, size: 20),
    );
  }

  Widget _buildStat(String value, String label) {
    return Column(
      children: [
        Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(color: AppColors.textDim, fontSize: 14)),
      ],
    );
  }
}
