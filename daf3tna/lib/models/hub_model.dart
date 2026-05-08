import 'package:daf3tna/models/user_model.dart';

class HubModel {
  final String id;
  final String name;
  final String category;
  final String color;
  final String icon;
  final String? description;
  final UserModel? admin;
  final String batchId;
  final List<String> members;
  final List<HubChannel> textChannels;
  final List<HubChannel> voiceChannels;

  HubModel({
    required this.id,
    required this.name,
    required this.category,
    required this.color,
    required this.icon,
    this.description,
    this.admin,
    required this.batchId,
    required this.members,
    this.textChannels = const [],
    this.voiceChannels = const [],
  });

  factory HubModel.fromJson(Map<String, dynamic> json) {
    return HubModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      category: (json['category'] ?? 'عام').toString(),
      color: (json['color'] ?? '#3B82F6').toString(),
      icon: (json['icon'] ?? 'hub').toString(),
      description: json['description']?.toString(),
      admin: json['admin'] != null ? UserModel.fromJson(json['admin'] as Map<String, dynamic>) : null,
      batchId: (json['batchId'] ?? '').toString(),
      members: List<String>.from(json['members'] ?? []),
      textChannels: (json['textChannels'] as List? ?? [])
          .map((e) => HubChannel.fromJson(e as Map<String, dynamic>))
          .toList(),
      voiceChannels: (json['voiceChannels'] as List? ?? [])
          .map((e) => HubChannel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class HubChannel {
  final String id;
  final String name;

  HubChannel({required this.id, required this.name});

  factory HubChannel.fromJson(Map<String, dynamic> json) {
    return HubChannel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
    );
  }
}

class HubMessageModel {
  final String id;
  final UserModel sender;
  final String hubId;
  final String channelId;
  final String? text;
  final String? mediaUrl;
  final String? mediaType;
  final DateTime createdAt;

  HubMessageModel({
    required this.id,
    required this.sender,
    required this.hubId,
    required this.channelId,
    this.text,
    this.mediaUrl,
    this.mediaType,
    required this.createdAt,
  });

  factory HubMessageModel.fromJson(Map<String, dynamic> json) {
    return HubMessageModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      sender: UserModel.fromJson(json['sender'] as Map<String, dynamic>),
      hubId: (json['hubId'] ?? '').toString(),
      channelId: (json['channelId'] ?? '').toString(),
      text: json['text']?.toString(),
      mediaUrl: json['mediaUrl']?.toString(),
      mediaType: json['mediaType']?.toString(),
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'sender': sender.toJson(),
      'hubId': hubId,
      'channelId': channelId,
      'text': text,
      'mediaUrl': mediaUrl,
      'mediaType': mediaType,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
