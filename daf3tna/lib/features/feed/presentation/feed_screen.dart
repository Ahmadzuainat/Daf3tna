import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/features/feed/providers/feed_provider.dart';
import 'package:daf3tna/features/feed/presentation/widgets/post_card.dart';
import 'package:daf3tna/features/feed/presentation/widgets/stories_bar.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart';
import 'package:go_router/go_router.dart';

import 'package:daf3tna/core/widgets/shimmer_loading.dart';

class _FeedShimmer extends StatelessWidget {
  const _FeedShimmer();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const ShimmerLoading.circular(width: 40, height: 40),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ShimmerLoading.rectangular(height: 12, width: MediaQuery.of(context).size.width * 0.3),
                  const SizedBox(height: 8),
                  ShimmerLoading.rectangular(height: 10, width: MediaQuery.of(context).size.width * 0.2),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          const ShimmerLoading.rectangular(height: 14),
          const SizedBox(height: 8),
          const ShimmerLoading.rectangular(height: 14, width: 200),
          const SizedBox(height: 16),
          const ShimmerLoading.rectangular(height: 200),
        ],
      ),
    );
  }
}
class FeedScreen extends ConsumerStatefulWidget {
  const FeedScreen({super.key});

  @override
  ConsumerState<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends ConsumerState<FeedScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(() {
      if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
        ref.read(feedProvider.notifier).fetchPosts();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final feedState = ref.watch(feedProvider);

    return RefreshIndicator(
      onRefresh: () => ref.read(feedProvider.notifier).fetchPosts(refresh: true),
      color: AppColors.primary,
      child: CustomScrollView(
        controller: _scrollController,
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                children: [
                  Container(
                    width: 12,
                    height: 12,
                    decoration: const BoxDecoration(
                      color: AppColors.success,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Text(
                    'متصل الآن (1)',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ],
              ),
            ),
          ),
          const SliverToBoxAdapter(child: StoriesBar()),
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 24.0, horizontal: 16),
              child: Row(
                children: [
                  Expanded(child: Divider(color: Colors.white10, thickness: 1)),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: Text(
                      'المنشورات الأخيرة',
                      style: TextStyle(
                        color: Colors.white24,
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 2,
                      ),
                    ),
                  ),
                  Expanded(child: Divider(color: Colors.white10, thickness: 1)),
                ],
              ),
            ),
          ),
          
          feedState.when(
            data: (posts) => SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  if (index >= posts.length) {
                    return const Padding(
                      padding: EdgeInsets.symmetric(vertical: 32),
                      child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                    );
                  }
                  return PostCard(post: posts[index]);
                },
                childCount: posts.length + (ref.watch(feedProvider.notifier).isFetching ? 1 : 0),
              ),
            ),
            loading: () => SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => const _FeedShimmer(),
                childCount: 3,
              ),
            ),
            error: (err, stack) => SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(LucideIcons.alertCircle, color: AppColors.error, size: 40),
                    const SizedBox(height: 16),
                    Text(err.toString(), style: const TextStyle(color: AppColors.textDim)),
                    TextButton(
                      onPressed: () => ref.read(feedProvider.notifier).fetchPosts(refresh: true),
                      child: const Text('إعادة المحاولة'),
                    ),
                  ],
                ),
              ),
            ),
          ),
          
          const SliverToBoxAdapter(child: SizedBox(height: 40)),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }
}
