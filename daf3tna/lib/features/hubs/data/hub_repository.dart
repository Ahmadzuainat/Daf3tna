import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:daf3tna/core/network/api_client.dart';
import 'package:daf3tna/models/hub_model.dart';

final hubRepositoryProvider = Provider<HubRepository>((ref) {
  return HubRepository(ref.read(apiClientProvider));
});

class HubRepository {
  final Dio _dio;

  HubRepository(this._dio);

  Future<List<HubModel>> fetchHubs() async {
    try {
      final response = await _dio.get('hubs');
      final List data = response.data ?? [];
      return data.map((json) => HubModel.fromJson(json as Map<String, dynamic>)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<HubModel> joinHub(String hubId) async {
    try {
      final response = await _dio.post('hubs/$hubId/join');
      return HubModel.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      rethrow;
    }
  }

  Future<List<HubMessageModel>> fetchMessages(String hubId, String channelId) async {
    try {
      final response = await _dio.get('hubs/$hubId/messages/$channelId');
      final List data = response.data ?? [];
      return data.map((json) => HubMessageModel.fromJson(json as Map<String, dynamic>)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<HubMessageModel> sendMessage({
    required String hubId,
    required String channelId,
    String? text,
    String? mediaUrl,
    String? mediaType,
  }) async {
    try {
      final response = await _dio.post('hubs/$hubId/messages', data: {
        'channelId': channelId,
        'text': text,
        'mediaUrl': mediaUrl,
        'mediaType': mediaType,
      });
      return HubMessageModel.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      rethrow;
    }
  }
}
