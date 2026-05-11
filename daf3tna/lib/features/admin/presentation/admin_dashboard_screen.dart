import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/admin/data/admin_repository.dart';
import 'package:daf3tna/core/utils/toast_service.dart';
import 'package:daf3tna/features/admin/presentation/user_management_screen.dart';

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  bool _isMaintenance = false;
  final TextEditingController _messageController = TextEditingController();
  final TextEditingController _alertController = TextEditingController();
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchStatus();
  }

  Future<void> _fetchStatus() async {
    try {
      final status = await ref.read(adminRepositoryProvider).getSystemStatus();
      setState(() {
        _isMaintenance = status['isUnderMaintenance'] ?? false;
        _messageController.text = status['maintenanceMessage'] ?? 'الموقع في صيانة حالياً';
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) ToastService.showError(context, 'فشل جلب حالة النظام');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handleUpdateStatus() async {
    try {
      await ref.read(adminRepositoryProvider).updateSystemStatus(_isMaintenance, _messageController.text);
      if (mounted) ToastService.showSuccess(context, 'تم تحديث حالة النظام بنجاح');
    } catch (e) {
      if (mounted) ToastService.showError(context, 'فشل التحديث');
    }
  }

  Future<void> _handleKickAll() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('طرد الجميع؟', style: TextStyle(color: Colors.white)),
        content: const Text('سيتم تسجيل خروج كافة المستخدمين فوراً.', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('إلغاء')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('طرد الجميع', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await ref.read(adminRepositoryProvider).kickAllUsers();
        if (mounted) ToastService.showSuccess(context, 'تم إرسال أمر الطرد للجميع');
      } catch (e) {
        if (mounted) ToastService.showError(context, 'فشل تنفيذ العملية');
      }
    }
  }

  Future<void> _handleBroadcast() async {
    if (_alertController.text.isEmpty) return;
    try {
      await ref.read(adminRepositoryProvider).broadcastAlert(_alertController.text);
      _alertController.clear();
      if (mounted) ToastService.showSuccess(context, 'تم إرسال التنبيه للجميع');
    } catch (e) {
      if (mounted) ToastService.showError(context, 'فشل الإرسال');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(body: Center(child: CircularProgressIndicator()));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('لوحة تحكم الـ SuperAdmin', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildCard(
            title: 'وضع الصيانة',
            icon: LucideIcons.settings,
            child: Column(
              children: [
                SwitchListTile(
                  title: const Text('تفعيل وضع الصيانة', style: TextStyle(color: Colors.white)),
                  subtitle: const Text('سيتم منع المستخدمين من دخول المنصة', style: TextStyle(color: AppColors.textDim, fontSize: 12)),
                  value: _isMaintenance,
                  onChanged: (v) => setState(() => _isMaintenance = v),
                  activeColor: AppColors.primary,
                ),
                TextField(
                  controller: _messageController,
                  textAlign: TextAlign.right,
                  decoration: const InputDecoration(
                    labelText: 'رسالة الصيانة',
                    labelStyle: TextStyle(color: AppColors.primary),
                  ),
                  style: const TextStyle(color: Colors.white),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _handleUpdateStatus,
                  child: const Text('حفظ الإعدادات'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          _buildCard(
            title: 'إرسال تنبيه عالمي',
            icon: LucideIcons.megaphone,
            child: Column(
              children: [
                TextField(
                  controller: _alertController,
                  textAlign: TextAlign.right,
                  decoration: const InputDecoration(
                    hintText: 'اكتب التنبيه هنا...',
                    hintStyle: TextStyle(color: AppColors.textMuted),
                  ),
                  style: const TextStyle(color: Colors.white),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _handleBroadcast,
                  child: const Text('إرسال للجميع'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          _buildCard(
            title: 'إجراءات عاجلة',
            icon: LucideIcons.alertOctagon,
            child: Column(
              children: [
                ListTile(
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const UserManagementScreen())),
                  leading: const Icon(LucideIcons.users, color: AppColors.primary),
                  title: const Text('إدارة المستخدمين', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  subtitle: const Text('Search, ban, and manage roles', style: TextStyle(color: Colors.white24, fontSize: 10)),
                  trailing: const Icon(LucideIcons.chevronLeft, color: Colors.white24, size: 18),
                ),
                const Divider(color: Colors.white10),
                ListTile(
                  onTap: _handleKickAll,
                  leading: const Icon(LucideIcons.userX, color: Colors.red),
                  title: const Text('طرد كافة المستخدمين', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                  subtitle: const Text('Force Logout all active sessions', style: TextStyle(color: Colors.white24, fontSize: 10)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCard({required String title, required IconData icon, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Text(title, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(width: 12),
              Icon(icon, color: AppColors.primary, size: 20),
            ],
          ),
          const Divider(height: 32, color: Colors.white10),
          child,
        ],
      ),
    );
  }
}
