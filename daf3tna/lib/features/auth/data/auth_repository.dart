import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:daf3tna/core/network/api_client.dart';
import 'package:daf3tna/models/user_model.dart';
import 'package:daf3tna/core/storage/secure_storage_service.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.read(apiClientProvider), ref.read(secureStorageServiceProvider));
});

final currentUserProvider = StateProvider<UserModel?>((ref) => null);

class AuthRepository {
  final Dio _dio;
  final SecureStorageService _storage;

  AuthRepository(this._dio, this._storage);

  Future<UserModel> login(String email, String password) async {
    try {
      final response = await _dio.post('auth/login', data: {
        'email': email,
        'password': password,
      });

      final data = response.data;
      if (data == null || data is! Map<String, dynamic>) {
        throw Exception('تنسيق الرد من السيرفر غير صحيح');
      }

      final token = data['token'];
      if (token == null) {
        throw Exception('فشل الحصول على توكن الدخول');
      }

      await _storage.saveToken(token.toString());
      
      // Pass the entire map, UserModel.fromJson handles internal nulls
      return UserModel.fromJson(data);
    } catch (e) {
      if (e is DioException) {
        final message = e.response?.data?['message'] ?? e.message;
        throw Exception(message);
      }
      rethrow;
    }
  }

  Future<void> register(Map<String, dynamic> data) async {
    try {
      await _dio.post('auth/register', data: data);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> verifyOtp(String email, String otp) async {
    try {
      await _dio.post('auth/verify-otp', data: {
        'email': email,
        'otp': otp,
      });
    } catch (e) {
      rethrow;
    }
  }

  Future<void> logout() async {
    await _storage.clearAll();
  }
}
