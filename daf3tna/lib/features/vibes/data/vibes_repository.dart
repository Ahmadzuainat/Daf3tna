import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:daf3tna/core/network/api_client.dart';

final vibesRepositoryProvider = Provider<VibesRepository>((ref) {
  return VibesRepository(ref.read(apiClientProvider));
});

class VibesRepository {
  final Dio _dio;

  VibesRepository(this._dio);

  Future<List<dynamic>> fetchVibes(String type) async {
    String endpoint = type;
    if (type == 'panic') endpoint = 'panics';
    if (type == 'time_capsule') endpoint = 'time-capsules';
    
    final response = await _dio.get('vibes/$endpoint');
    return response.data;
  }

  Future<void> voteVibe(String type, String id) async {
    String endpoint = type;
    if (type == 'awards') endpoint = 'awards';
    await _dio.post('vibes/$endpoint/$id/vote');
  }

  Future<void> replyPanic(String panicId, String text) async {
    await _dio.post('vibes/panics/$panicId/reply', data: {'text': text});
  }

  Future<void> deletePanic(String panicId) async {
    await _dio.delete('vibes/panics/$panicId');
  }

  Future<void> createTimeCapsule(String text, String unlockDate, bool isPublic) async {
    await _dio.post('vibes/time-capsules', data: {
      'text': text,
      'unlockDate': unlockDate,
      'isPublic': isPublic,
    });
  }

  Future<void> addVibe(String type, String text, {Map<String, dynamic>? extraData}) async {
    String endpoint = type;
    if (type == 'panic') endpoint = 'panics';
    if (type == 'confessions') {
      await _dio.post('vibes/confessions', data: {'text': text});
      return;
    }
    
    final data = {'text': text, ...?extraData};
    await _dio.post('vibes/$endpoint', data: data);
  }

  Future<void> signNotebook(String notebookId, String text) async {
    await _dio.post('vibes/notebooks/$notebookId/messages', data: {'text': text});
  }

  Future<void> createNotebook(Map<String, dynamic> data) async {
    await _dio.post('vibes/notebooks', data: data);
  }

  Future<void> updateNotebook(String id, Map<String, dynamic> data) async {
    await _dio.put('vibes/notebooks/$id', data: data);
  }

  Future<String> uploadImage(List<int> bytes, String filename) async {
    try {
      final formData = FormData.fromMap({
        'image': MultipartFile.fromBytes(bytes, filename: filename),
        'folder': 'instants',
      });
      final response = await _dio.post('upload', data: formData);
      return response.data['imageUrl'];
    } catch (e) {
      rethrow;
    }
  }

  Future<void> createInstant(String mediaUrl) async {
    await _dio.post('vibes/instants', data: {'mediaUrl': mediaUrl});
  }

  Future<void> viewInstant(String id) async {
    await _dio.post('vibes/instants/$id/view');
  }

  Future<void> likeInstant(String id) async {
    await _dio.post('vibes/instants/$id/like');
  }

  Future<void> deleteInstant(String id) async {
    await _dio.delete('vibes/instants/$id');
  }

  Future<void> deleteAward(String id) async {
    await _dio.delete('vibes/awards/$id');
  }
  
  Future<void> deleteQuote(String id) async {
    await _dio.delete('vibes/quotes/$id');
  }

  Future<void> deleteConfession(String id) async {
    await _dio.delete('vibes/confessions/$id');
  }

  Future<void> deleteNotebook(String id) async {
    await _dio.delete('vibes/notebooks/$id');
  }

  Future<void> deleteNotebookMessage(String notebookId, String messageId) async {
    await _dio.delete('vibes/notebooks/$notebookId/messages/$messageId');
  }

  Future<void> deleteTimeCapsule(String id) async {
    await _dio.delete('vibes/time-capsules/$id');
  }
}
