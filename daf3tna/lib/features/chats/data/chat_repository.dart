import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:daf3tna/core/network/api_client.dart';
import 'package:daf3tna/models/chat_model.dart';

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return ChatRepository(ref.read(apiClientProvider));
});

class ChatRepository {
  final Dio _dio;

  ChatRepository(this._dio);

  Future<List<ChatModel>> fetchChats() async {
    try {
      final response = await _dio.get('/chats');
      final List data = response.data;
      return data.map((json) => ChatModel.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<List<MessageModel>> fetchMessages(String chatId) async {
    try {
      final response = await _dio.get('/chats/$chatId/messages');
      final List data = response.data;
      return data.map((json) => MessageModel.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<MessageModel> sendMessage(String chatId, String content) async {
    try {
      final response = await _dio.post('/chats/$chatId/messages', data: {
        'content': content,
      });
      return MessageModel.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> markAsRead(String chatId) async {
    try {
      await _dio.put('/chats/$chatId/read');
    } catch (e) {
      rethrow;
    }
  }
}
