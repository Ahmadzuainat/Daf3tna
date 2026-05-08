import 'package:daf3tna/models/user_model.dart';

class ChatModel {
  final String id;
  final List<UserModel> participants;
  final MessageModel? lastMessage;
  final Map<String, int> unreadCount;
  final DateTime updatedAt;

  ChatModel({
    required this.id,
    required this.participants,
    this.lastMessage,
    required this.unreadCount,
    required this.updatedAt,
  });

  ChatModel copyWith({
    String? id,
    List<UserModel>? participants,
    MessageModel? lastMessage,
    Map<String, int>? unreadCount,
    DateTime? updatedAt,
  }) {
    return ChatModel(
      id: id ?? this.id,
      participants: participants ?? this.participants,
      lastMessage: lastMessage ?? this.lastMessage,
      unreadCount: unreadCount ?? this.unreadCount,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  factory ChatModel.fromJson(Map<String, dynamic> json) {
    return ChatModel(
      id: json['_id'],
      participants: (json['participants'] as List)
          .map((p) => UserModel.fromJson(p))
          .toList(),
      lastMessage: json['lastMessage'] != null 
          ? MessageModel.fromJson(json['lastMessage']) 
          : null,
      unreadCount: Map<String, int>.from(json['unreadCount'] ?? {}),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }
}

class MessageModel {
  final String id;
  final String sender;
  final String content;
  final String? type;
  final DateTime createdAt;

  MessageModel({
    required this.id,
    required this.sender,
    required this.content,
    this.type,
    required this.createdAt,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['_id'],
      sender: json['sender'] is Map ? json['sender']['_id'] : json['sender'],
      content: json['content'] ?? '',
      type: json['type'] ?? 'text',
      createdAt: DateTime.parse(json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'sender': sender,
      'content': content,
      'type': type,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
