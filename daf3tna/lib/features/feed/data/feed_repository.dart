import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/supabase_client.dart';
import '../../../core/models/post_model.dart';

final feedRepositoryProvider = Provider<FeedRepository>((ref) {
  return FeedRepository(ref.watch(supabaseProvider));
});

class FeedRepository {
  final SupabaseClient _supabase;

  FeedRepository(this._supabase);

  Future<List<PostModel>> fetchBatchPosts() async {
    // Relying on RLS: The database inherently filters out posts not matching the user's batch_id.
    // However, explicitly querying batch_id adds clarity.
    final currentUser = _supabase.auth.currentUser;
    if (currentUser == null) throw Exception('Not authenticated');

    final batchId = currentUser.userMetadata?['batch_id'] as String?;
    if (batchId == null) throw Exception('User has no batch assigned');

    final response = await _supabase
        .from('posts')
        .select('*, users!inner(*)') // Inner join to get author data
        .eq('batch_id', batchId)
        .order('created_at', ascending: false)
        .limit(20);

    return (response as List<dynamic>)
        .map((data) => PostModel.fromJson(data as Map<String, dynamic>))
        .toList();
  }

  Future<void> createPost(String content, List<String>? mediaUrls) async {
    final currentUser = _supabase.auth.currentUser;
    if (currentUser == null) throw Exception('Not authenticated');

    final batchId = currentUser.userMetadata?['batch_id'] as String?;
    if (batchId == null) throw Exception('User has no batch assigned');

    await _supabase.from('posts').insert({
      'user_id': currentUser.id,
      'batch_id': batchId,
      'content': content,
      'media_urls': mediaUrls,
    });
  }
}
