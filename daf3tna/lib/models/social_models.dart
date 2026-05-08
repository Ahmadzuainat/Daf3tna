import 'package:daf3tna/models/user_model.dart';

class StoryModel {
  final String id;
  final UserModel user;
  final String mediaUrl;
  final String? mediaPublicId;
  final List<String> viewers;
  final DateTime createdAt;

  StoryModel({
    required this.id,
    required this.user,
    required this.mediaUrl,
    this.mediaPublicId,
    required this.viewers,
    required this.createdAt,
  });

  factory StoryModel.fromJson(Map<String, dynamic> json) {
    return StoryModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      user: UserModel.fromJson(json['user'] as Map<String, dynamic>),
      mediaUrl: (json['mediaUrl'] ?? '').toString(),
      mediaPublicId: json['mediaPublicId']?.toString(),
      viewers: List<String>.from(json['viewers'] ?? []),
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class NotificationModel {
  final String id;
  final String type;
  final UserModel? sender;
  final String content;
  final bool isRead;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.type,
    this.sender,
    required this.content,
    required this.isRead,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      type: (json['type'] ?? 'info').toString(),
      sender: json['sender'] != null ? UserModel.fromJson(json['sender'] as Map<String, dynamic>) : null,
      content: (json['message'] ?? json['content'] ?? '').toString(),
      isRead: json['isRead'] ?? false,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }
}

class ChatModel {
  final String id;
  final List<UserModel> participants;
  final String? lastMessageContent;
  final DateTime updatedAt;
  final Map<String, int> unreadCount;

  ChatModel({
    required this.id,
    required this.participants,
    this.lastMessageContent,
    required this.updatedAt,
    required this.unreadCount,
  });

  factory ChatModel.fromJson(Map<String, dynamic> json) {
    return ChatModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      participants: (json['participants'] as List? ?? [])
          .map((e) => UserModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      lastMessageContent: json['lastMessage'] != null ? (json['lastMessage']['content'] ?? '').toString() : null,
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
      unreadCount: Map<String, int>.from(json['unreadCount'] ?? {}),
    );
  }
}
