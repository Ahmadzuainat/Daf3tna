import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:daf3tna/features/feed/data/feed_repository.dart';
import 'package:daf3tna/models/post_model.dart';

final feedProvider = StateNotifierProvider<FeedNotifier, AsyncValue<List<PostModel>>>((ref) {
  return FeedNotifier(ref.read(feedRepositoryProvider));
});

class FeedNotifier extends StateNotifier<AsyncValue<List<PostModel>>> {
  final FeedRepository _repository;
  int _currentPage = 1;
  bool _hasMore = true;
  bool _isFetching = false;
  bool get isFetching => _isFetching;

  FeedNotifier(this._repository) : super(const AsyncValue.loading()) {
    fetchPosts();
  }

  Future<void> fetchPosts({bool refresh = false}) async {
    if (_isFetching) return;
    
    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
    }

    if (!_hasMore && !refresh) return;

    _isFetching = true;
    try {
      // Background refresh: Only show loading if we have no data yet
      if (refresh && (state.value == null || state.value!.isEmpty)) {
        state = const AsyncValue.loading();
      }
      
      final posts = await _repository.fetchPosts(page: _currentPage);
      
      if (posts.isEmpty) {
        _hasMore = false;
      } else {
        _currentPage++;
      }

      final currentPosts = refresh ? <PostModel>[] : (state.value ?? []);
      
      // Robust duplicate detection using IDs
      final existingIds = currentPosts.map((p) => p.id).toSet();
      final newUniquePosts = posts.where((p) => !existingIds.contains(p.id)).toList();

      if (refresh) {
        state = AsyncValue.data(posts);
      } else {
        if (newUniquePosts.isEmpty && posts.isNotEmpty) {
          // If we got posts but none are new, we might be at the end or repeating
          _hasMore = false;
        }
        state = AsyncValue.data([...currentPosts, ...newUniquePosts]);
      }
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    } finally {
      _isFetching = false;
    }
  }
}
