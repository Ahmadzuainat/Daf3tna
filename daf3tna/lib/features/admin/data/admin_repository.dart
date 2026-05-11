import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:daf3tna/core/network/api_client.dart';

final adminRepositoryProvider = Provider<AdminRepository>((ref) {
  return AdminRepository(ref.read(apiClientProvider));
});

class AdminRepository {
  final Dio _dio;
  AdminRepository(this._dio);

  Future<Map<String, dynamic>> getSystemStatus() async {
    final response = await _dio.get('/admin/status');
    return response.data;
  }

  Future<void> updateSystemStatus(bool isUnderMaintenance, String message) async {
    await _dio.post('/admin/status', data: {
      'isUnderMaintenance': isUnderMaintenance,
      'maintenanceMessage': message,
    });
  }

  Future<void> kickAllUsers() async {
    await _dio.post('/admin/kick-all');
  }

  Future<void> broadcastAlert(String message) async {
    await _dio.post('/admin/broadcast', data: {'message': message});
  }

  Future<List<dynamic>> searchUsers(String query) async {
    final response = await _dio.get('/admin/users/search', queryParameters: {'q': query});
    return response.data;
  }

  Future<void> updateUserRole(String userId, String role) async {
    await _dio.put('/admin/users/$userId/role', data: {'role': role});
  }

  Future<void> toggleUserBan(String userId) async {
    await _dio.post('/admin/users/$userId/toggle-ban');
  }
}
