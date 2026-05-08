import 'package:daf3tna/models/user_model.dart';

class PanicModel {
  final String id;
  final UserModel author;
  final String text;
  final List<PanicReply> replies;
  final bool active;
  final DateTime createdAt;

  PanicModel({
    required this.id,
    required this.author,
    required this.text,
    required this.replies,
    required this.active,
    required this.createdAt,
  });

  factory PanicModel.fromJson(Map<String, dynamic> json) {
    return PanicModel(
      id: json['_id'],
      author: UserModel.fromJson(json['author']),
      text: json['text'] ?? '',
      replies: (json['replies'] as List? ?? [])
          .map((r) => PanicReply.fromJson(r))
          .toList(),
      active: json['active'] ?? true,
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}

class PanicReply {
  final String id;
  final UserModel user;
  final String text;
  final DateTime createdAt;

  PanicReply({
    required this.id,
    required this.user,
    required this.text,
    required this.createdAt,
  });

  factory PanicReply.fromJson(Map<String, dynamic> json) {
    return PanicReply(
      id: json['_id'],
      user: UserModel.fromJson(json['user']),
      text: json['text'] ?? '',
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }
}
