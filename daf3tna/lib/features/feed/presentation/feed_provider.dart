import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/feed_repository.dart';
import '../../../core/models/post_model.dart';

final batchFeedProvider = FutureProvider<List<PostModel>>((ref) async {
  final repository = ref.watch(feedRepositoryProvider);
  return await repository.fetchBatchPosts();
});
