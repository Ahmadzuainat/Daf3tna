import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/admin/data/admin_repository.dart';
import 'package:daf3tna/core/utils/toast_service.dart';
import 'package:cached_network_image/cached_network_image.dart';

class UserManagementScreen extends ConsumerStatefulWidget {
  const UserManagementScreen({super.key});

  @override
  ConsumerState<UserManagementScreen> createState() => _UserManagementScreenState();
}

class _UserManagementScreenState extends ConsumerState<UserManagementScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<dynamic> _users = [];
  bool _isLoading = false;

  Future<void> _handleSearch() async {
    if (_searchController.text.trim().isEmpty) return;
    setState(() => _isLoading = true);
    try {
      final results = await ref.read(adminRepositoryProvider).searchUsers(_searchController.text.trim());
      setState(() {
        _users = results;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) ToastService.showError(context, 'فشل البحث عن المستخدمين');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handleToggleBan(String userId, String fullName) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('تغيير حالة الحظر', style: TextStyle(color: Colors.white)),
        content: Text('هل أنت متأكد من تغيير حالة حظر المستخدم $fullName؟', style: const TextStyle(color: Colors.white70)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('إلغاء')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('تأكيد', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await ref.read(adminRepositoryProvider).toggleUserBan(userId);
        _handleSearch(); // Refresh list
        if (mounted) ToastService.showSuccess(context, 'تمت العملية بنجاح');
      } catch (e) {
        if (mounted) ToastService.showError(context, 'فشلت العملية');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('إدارة المستخدمين', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: TextField(
              controller: _searchController,
              textAlign: TextAlign.right,
              style: const TextStyle(color: Colors.white),
              onSubmitted: (_) => _handleSearch(),
              decoration: InputDecoration(
                hintText: 'ابحث بالاسم أو البريد الإلكتروني...',
                hintStyle: const TextStyle(color: AppColors.textMuted),
                prefixIcon: IconButton(
                  icon: const Icon(LucideIcons.search, color: AppColors.primary),
                  onPressed: _handleSearch,
                ),
                filled: true,
                fillColor: AppColors.surface,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
              ),
            ),
          ),
          Expanded(
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator())
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: _users.length,
                  itemBuilder: (context, index) {
                    final user = _users[index];
                    final isBanned = user['isBanned'] ?? false;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: isBanned ? Colors.red.withOpacity(0.3) : Colors.white.withOpacity(0.05)),
                      ),
                      child: Row(
                        children: [
                          IconButton(
                            icon: Icon(
                              isBanned ? LucideIcons.unlock : LucideIcons.lock,
                              color: isBanned ? Colors.greenAccent : Colors.redAccent,
                            ),
                            onPressed: () => _handleToggleBan(user['_id'], user['fullName']),
                          ),
                          const Spacer(),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                user['fullName'] ?? '',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                              ),
                              Text(
                                user['email'] ?? '',
                                style: const TextStyle(color: AppColors.textDim, fontSize: 11),
                              ),
                              Container(
                                margin: const EdgeInsets.only(top: 4),
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  user['role'] ?? 'user',
                                  style: const TextStyle(color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(width: 12),
                          CircleAvatar(
                            radius: 24,
                            backgroundImage: CachedNetworkImageProvider(user['avatarUrl'] ?? 'https://ui-avatars.com/api/?name=U'),
                          ),
                        ],
                      ),
                    );
                  },
                ),
          ),
        ],
      ),
    );
  }
}
