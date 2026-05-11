import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:daf3tna/core/network/api_client.dart';
import 'package:daf3tna/models/post_model.dart';

final feedRepositoryProvider = Provider<FeedRepository>((ref) {
  return FeedRepository(ref.read(apiClientProvider));
});

class FeedRepository {
  final Dio _dio;

  FeedRepository(this._dio);

  Future<List<PostModel>> fetchPosts({int page = 1, int limit = 10}) async {
    try {
      final response = await _dio.get('posts', queryParameters: {'page': page, 'limit': limit});
      // The backend returns { success: true, data: [...] }
      final List data = response.data['data'] ?? [];
      return data
          .where((json) => json != null && json is Map<String, dynamic>)
          .map((json) => PostModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deletePost(String id) async {
    await _dio.delete('posts/$id');
  }

  Future<void> deleteComment(String postId, String commentId) async {
    await _dio.delete('posts/$postId/comments/$commentId');
  }
}
