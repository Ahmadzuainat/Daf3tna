import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:daf3tna/core/network/api_client.dart';
import 'package:daf3tna/models/user_model.dart';

final searchRepositoryProvider = Provider<SearchRepository>((ref) {
  return SearchRepository(ref.read(apiClientProvider));
});

class SearchRepository {
  final Dio _dio;

  SearchRepository(this._dio);

  Future<List<UserModel>> searchUsers(String query) async {
    try {
      final response = await _dio.get('/users/search', queryParameters: {'q': query});
      if (response.data is List) {
        return (response.data as List).map((u) => UserModel.fromJson(u)).toList();
      }
      return [];
    } catch (e) {
      rethrow;
    }
  }

  Future<List<UserModel>> getSearchHistory() async {
    try {
      final response = await _dio.get('/users/search-history');
      if (response.data is List) {
        return (response.data as List).map((u) => UserModel.fromJson(u)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<void> addToSearchHistory(String userId) async {
    try {
      await _dio.post('/users/search-history', data: {'userId': userId});
    } catch (_) {}
  }

  Future<List<UserModel>> getBatchUsers() async {
    try {
      final response = await _dio.get('/users/batch');
      if (response.data is List) {
        return (response.data as List).map((u) => UserModel.fromJson(u)).toList();
      }
      return [];
    } catch (e) {
      rethrow;
    }
  }
}
