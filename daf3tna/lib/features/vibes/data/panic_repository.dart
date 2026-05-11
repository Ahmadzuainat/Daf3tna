import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:daf3tna/core/network/api_client.dart';
import 'package:daf3tna/models/panic_model.dart';

final panicRepositoryProvider = Provider<PanicRepository>((ref) {
  return PanicRepository(ref.read(apiClientProvider));
});

class PanicRepository {
  final Dio _dio;

  PanicRepository(this._dio);

  Future<List<PanicModel>> fetchPanics() async {
    try {
      final response = await _dio.get('vibes/panics');
      final List data = response.data;
      return data.map((json) => PanicModel.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<PanicModel> createPanic(String text) async {
    try {
      final response = await _dio.post('vibes/panics', data: {'text': text});
      return PanicModel.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }

  Future<PanicModel> replyToPanic(String panicId, String text) async {
    try {
      final response = await _dio.post('vibes/panics/$panicId/reply', data: {'text': text});
      return PanicModel.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }
}
