import 'package:daf3tna/models/user_model.dart';

class PostModel {
  final String id;
  final UserModel user;
  final String text;
  final List<String> mediaUrls;
  final List<String> likes;
  final int commentsCount;
  final bool isAnonymous;
  final DateTime createdAt;

  PostModel({
    required this.id,
    required this.user,
    required this.text,
    required this.mediaUrls,
    required this.likes,
    required this.commentsCount,
    this.isAnonymous = false,
    required this.createdAt,
  });

  factory PostModel.fromJson(Map<String, dynamic> json) {
    return PostModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      user: UserModel.fromJson(json['user'] ?? {}),
      text: json['text'] ?? '',
      mediaUrls: List<String>.from(json['mediaUrls'] ?? []),
      likes: List<String>.from(json['likes'] ?? []),
      commentsCount: json['commentsCount'] ?? 0,
      isAnonymous: json['isAnonymous'] ?? false,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }
}
