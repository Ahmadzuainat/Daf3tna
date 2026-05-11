import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:daf3tna/core/network/api_client.dart'; // Assuming this exists or using dio directly

class GameRepository {
  final Dio _dio;
  
  GameRepository(this._dio);

  Future<Response> createGame(String gameType) async {
    return await _dio.post('games/create', data: {'gameType': gameType});
  }

  Future<Response> joinGame(String roomCode) async {
    return await _dio.post('games/join', data: {'roomCode': roomCode});
  }

  Future<Response> getGameStatus(String roomCode) async {
    return await _dio.get('games/$roomCode');
  }
}

final gameRepositoryProvider = Provider((ref) {
  final dio = ref.read(apiClientProvider);
  return GameRepository(dio);
});
