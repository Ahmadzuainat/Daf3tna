import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:daf3tna/core/network/api_client.dart';
import 'package:daf3tna/models/user_model.dart';
import 'package:daf3tna/features/feed/presentation/widgets/post_card.dart'; // Assuming we'll use PostCard

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepository(ref.read(apiClientProvider));
});

class ProfileRepository {
  final Dio _dio;

  ProfileRepository(this._dio);

  Future<UserModel> getProfile(String username) async {
    try {
      final response = await _dio.get('/users/$username');
      return UserModel.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }

  Future<List<dynamic>> getUserPosts(String userId) async {
    try {
      final response = await _dio.get('/posts/user/$userId');
      return response.data ?? [];
    } catch (e) {
      return [];
    }
  }

  Future<UserModel> updateProfile({
    String? fullName,
    String? bio,
    String? avatarPath,
    String? coverPath,
  }) async {
    try {
      final formData = FormData.fromMap({
        if (fullName != null) 'fullName': fullName,
        if (bio != null) 'bio': bio,
        if (avatarPath != null)
          'avatar': await MultipartFile.fromFile(avatarPath),
        if (coverPath != null)
          'cover': await MultipartFile.fromFile(coverPath),
      });

      final response = await _dio.put('/users/profile', data: formData);
      return UserModel.fromJson(response.data['data']);
    } catch (e) {
      rethrow;
    }
  }
}
