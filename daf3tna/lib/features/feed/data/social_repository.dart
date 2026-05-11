import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:daf3tna/core/network/api_client.dart';
import 'package:daf3tna/models/social_models.dart';

final socialRepositoryProvider = Provider<SocialRepository>((ref) {
  return SocialRepository(ref.read(apiClientProvider));
});

class SocialRepository {
  final Dio _dio;

  SocialRepository(this._dio);

  // --- Stories ---
  Future<List<StoryModel>> fetchStories() async {
    try {
      final response = await _dio.get('stories');
      if (response.data is List) {
        return (response.data as List).map((s) => StoryModel.fromJson(s)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<void> addStory(String imageUrl) async {
    await _dio.post('stories', data: {'imageUrl': imageUrl});
  }

  Future<void> viewStory(String id) async {
    try {
      await _dio.post('stories/$id/view');
    } catch (_) {}
  }

  // --- Notifications ---
  Future<List<NotificationModel>> fetchNotifications() async {
    try {
      final response = await _dio.get('notifications');
      if (response.data is List) {
        return (response.data as List).map((n) => NotificationModel.fromJson(n)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<void> markNotificationsRead() async {
    try {
      await _dio.put('notifications/mark-read');
    } catch (_) {}
  }

  // --- Chats (DMs) ---
  Future<List<ChatModel>> fetchChats() async {
    try {
      final response = await _dio.get('chats');
      if (response.data is List) {
        return (response.data as List).map((c) => ChatModel.fromJson(c)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<void> toggleLike(String postId) async {
    try {
      await _dio.put('posts/$postId/like');
    } catch (e) {
      rethrow;
    }
  }

  Future<void> toggleStoryLike(String storyId) async {
    try {
      await _dio.post('stories/$storyId/like');
    } catch (e) {
      rethrow;
    }
  }

  Future<void> toggleFollow(String userId) async {
    try {
      await _dio.post('users/$userId/follow');
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteStory(String id) async {
    await _dio.delete('stories/$id');
  }
}
