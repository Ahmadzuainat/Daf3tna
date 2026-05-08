class UserModel {
  final String id;
  final String fullName;
  final String username;
  final String email;
  final String? avatarUrl;
  final String? coverUrl;
  final String batchId;
  final String role;
  final String major;
  final String? bio;
  final String? university;
  final int? graduationYear;
   final List<String> followers;
  final List<String> following;
  final bool isOnline;

  UserModel({
    required this.id,
    required this.fullName,
    required this.username,
    required this.email,
    this.avatarUrl,
    this.coverUrl,
    required this.batchId,
    required this.role,
    required this.major,
    this.bio,
    this.university,
    this.graduationYear,
    this.followers = const [],
    this.following = const [],
    this.isOnline = false,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      fullName: (json['fullName'] ?? '').toString(),
      username: (json['username'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      avatarUrl: json['avatarUrl']?.toString(),
      coverUrl: json['coverUrl']?.toString(),
      batchId: (json['batchId'] ?? '').toString(),
      role: (json['role'] ?? 'student').toString(),
      major: (json['major'] ?? '').toString(),
      bio: json['bio']?.toString(),
      university: json['university']?.toString(),
      graduationYear: json['graduationYear'] is int ? json['graduationYear'] : int.tryParse(json['graduationYear']?.toString() ?? ''),
      followers: List<String>.from(json['followers'] ?? []),
      following: List<String>.from(json['following'] ?? []),
      isOnline: json['isOnline'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    '_id': id,
    'fullName': fullName,
    'username': username,
    'email': email,
    'avatarUrl': avatarUrl,
    'coverUrl': coverUrl,
    'batchId': batchId,
    'role': role,
    'major': major,
    'bio': bio,
    'university': university,
    'graduationYear': graduationYear,
    'followers': followers,
    'following': following,
    'isOnline': isOnline,
  };
}
