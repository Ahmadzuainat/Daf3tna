import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  Future<void> _handleLogin() async {
    setState(() => _isLoading = true);
    try {
      await ref.read(authRepositoryProvider).login(
        _emailController.text,
        _passwordController.text,
      );
      if (mounted) {
        context.go('/');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('فشل تسجيل الدخول: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 60),
              // Logo/Header
              const Center(
                child: Icon(LucideIcons.graduationCap, size: 80, color: AppColors.primary),
              ),
              const SizedBox(height: 24),
              const Text(
                'دفعتنا',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  letterSpacing: 1.5,
                ),
              ),
              const Text(
                'تواصل مع زملائك في الجامعة',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textDim, fontSize: 16),
              ),
              const SizedBox(height: 48),

              // Form
              _buildTextField(
                controller: _emailController,
                hint: 'البريد الإلكتروني',
                icon: LucideIcons.mail,
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _passwordController,
                hint: 'كلمة المرور',
                icon: LucideIcons.lock,
                isPassword: true,
              ),

              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton(
                  onPressed: () {},
                  child: const Text('نسيت كلمة المرور؟', style: TextStyle(color: AppColors.primary)),
                ),
              ),

              const SizedBox(height: 24),

              // Login Button
              ElevatedButton(
                onPressed: _isLoading ? null : _handleLogin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 0,
                ),
                child: _isLoading
                  ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('تسجيل الدخول', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),

              const SizedBox(height: 32),

              // Social Login
              const Row(
                children: [
                  Expanded(child: Divider(color: Colors.white10)),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: Text('أو سجل بواسطة', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                  ),
                  Expanded(child: Divider(color: Colors.white10)),
                ],
              ),

              const SizedBox(height: 24),

              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildSocialButton(LucideIcons.github),
                  const SizedBox(width: 16),
                  _buildSocialButton(LucideIcons.chrome),
                  const SizedBox(width: 16),
                  _buildSocialButton(LucideIcons.facebook),
                ],
              ),

              const SizedBox(height: 40),

              // Register Link
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  TextButton(
                    onPressed: () => context.push('/register'),
                    child: const Text('سجل الآن', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                  ),
                  const Text('ليس لديك حساب؟', style: TextStyle(color: AppColors.textDim)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSocialButton(IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Icon(icon, color: Colors.white, size: 24),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool isPassword = false,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: TextField(
        controller: controller,
        obscureText: isPassword,
        style: const TextStyle(color: Colors.white),
        textAlign: TextAlign.right,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: AppColors.textMuted),
          suffixIcon: Icon(icon, size: 22, color: AppColors.textMuted),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        ),
      ),
    );
  }
}
