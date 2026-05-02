import 'user_model.dart';

class PostModel {
  final String id;
  final String userId;
  final String batchId;
  final String content;
  final List<String>? mediaUrls;
  final DateTime createdAt;
  final UserModel? author;

  PostModel({
    required this.id,
    required this.userId,
    required this.batchId,
    required this.content,
    this.mediaUrls,
    required this.createdAt,
    this.author,
  });

  factory PostModel.fromJson(Map<String, dynamic> json) {
    return PostModel(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? '',
      batchId: json['batch_id'] ?? '',
      content: json['content'] ?? '',
      mediaUrls: json['media_urls'] != null ? List<String>.from(json['media_urls']) : null,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : DateTime.now(),
      author: json['users'] != null ? UserModel.fromJson(json['users']) : null,
    );
  }
}
