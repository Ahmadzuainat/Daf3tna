class UserModel {
  final String id;
  final String email;
  final String fullName;
  final String batchId;
  final String? avatarUrl;
  final String? bio;

  UserModel({
    required this.id,
    required this.email,
    required this.fullName,
    required this.batchId,
    this.avatarUrl,
    this.bio,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      fullName: json['full_name'] ?? '',
      batchId: json['batch_id'] ?? '',
      avatarUrl: json['avatar_url'],
      bio: json['bio'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'full_name': fullName,
      'batch_id': batchId,
      'avatar_url': avatarUrl,
      'bio': bio,
    };
  }
}
