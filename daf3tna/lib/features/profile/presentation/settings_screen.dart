import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart';
import 'package:daf3tna/features/auth/presentation/login_screen.dart';
import 'package:daf3tna/features/admin/presentation/admin_dashboard_screen.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('الإعدادات', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildSectionTitle('عام'),
          _buildSettingsTile(
            'المظهر الداكن',
            LucideIcons.moon,
            trailing: Switch(
              value: true,
              onChanged: (v) {},
              activeColor: AppColors.primary,
            ),
          ),
          _buildSettingsTile(
            'اللغة',
            LucideIcons.languages,
            subtitle: 'العربية',
            onTap: () {},
          ),
          const SizedBox(height: 32),
          _buildSectionTitle('الحساب والخصوصية'),
          _buildSettingsTile(
            'تغيير كلمة المرور',
            LucideIcons.lock,
            onTap: () {},
          ),
          _buildSettingsTile(
            'الحساب الخاص',
            LucideIcons.shield,
            trailing: Switch(
              value: false,
              onChanged: (v) {},
              activeColor: AppColors.primary,
            ),
          ),
          const SizedBox(height: 32),
          _buildSectionTitle('أخرى'),
          if (ref.watch(currentUserProvider)?.role == 'superadmin')
            _buildSettingsTile(
              'لوحة تحكم الـ SuperAdmin',
              LucideIcons.shieldCheck,
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const AdminDashboardScreen()),
                );
              },
            ),
          _buildSettingsTile(
            'حول التطبيق',
            LucideIcons.info,
            onTap: () {},
          ),
          _buildSettingsTile(
            'مركز المساعدة',
            LucideIcons.helpCircle,
            onTap: () {},
          ),
          const SizedBox(height: 48),
          
          // Logout Button
          Container(
            decoration: BoxDecoration(
              color: Colors.red.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: ListTile(
              onTap: () async {
                await ref.read(authRepositoryProvider).logout();
                if (context.mounted) {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (context) => const LoginScreen()),
                    (route) => false,
                  );
                }
              },
              leading: const Icon(LucideIcons.logOut, color: Colors.red),
              title: const Text(
                'تسجيل الخروج',
                style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
              ),
              trailing: const Icon(LucideIcons.chevronLeft, color: Colors.red, size: 18),
            ),
          ),
          
          const SizedBox(height: 24),
          const Center(
            child: Text(
              'Daf3tna v1.0.0',
              style: TextStyle(color: AppColors.textMuted, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, right: 4),
      child: Text(
        title,
        textAlign: TextAlign.right,
        style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13),
      ),
    );
  }

  Widget _buildSettingsTile(String title, IconData icon, {String? subtitle, Widget? trailing, VoidCallback? onTap}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: ListTile(
        onTap: onTap,
        leading: Icon(icon, color: Colors.white70, size: 22),
        title: Text(title, style: const TextStyle(color: Colors.white, fontSize: 15)),
        subtitle: subtitle != null ? Text(subtitle, style: const TextStyle(color: AppColors.textDim, fontSize: 12)) : null,
        trailing: trailing ?? const Icon(LucideIcons.chevronLeft, color: Colors.white24, size: 18),
      ),
    );
  }
}
