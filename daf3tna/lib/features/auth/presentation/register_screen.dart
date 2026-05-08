import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart';
import 'package:go_router/go_router.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _pageController = PageController();
  int _currentStep = 0;
  bool _isLoading = false;

  // Controllers Step 1
  final _fullNameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  // Controllers Step 2
  String? _selectedUniversity = 'جامعة آل البيت';
  String? _selectedMajor = 'تكنولوجيا المعلومات';
  final _yearController = TextEditingController(text: '2026');

  final List<String> _universities = ['جامعة آل البيت', 'الجامعة الأردنية', 'جامعة اليرموك'];
  final List<String> _majors = ['تكنولوجيا المعلومات', 'الهندسة', 'الطب', 'العلوم'];

  Future<void> _handleRegister() async {
    setState(() => _isLoading = true);
    try {
      final data = {
        'fullName': _fullNameController.text.trim(),
        'username': _usernameController.text.trim(),
        'email': _emailController.text.trim(),
        'password': _passwordController.text,
        'university': _selectedUniversity,
        'major': _selectedMajor,
        'graduationYear': int.tryParse(_yearController.text) ?? 2026,
      };

      await ref.read(authRepositoryProvider).register(data);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✅ تم إرسال رمز التحقق إلى بريدك الإلكتروني')),
        );
        // Navigate to OTP or Login
        context.go('/login');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ خطأ: ${e.toString().replaceAll('Exception:', '')}')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _nextStep() {
    if (_currentStep == 0) {
      if (_fullNameController.text.isEmpty || _usernameController.text.isEmpty || 
          _emailController.text.isEmpty || _passwordController.text.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('⚠️ يرجى ملء جميع الحقول')),
        );
        return;
      }
      _pageController.nextPage(duration: 300.ms, curve: Curves.easeInOut);
    } else {
      _handleRegister();
    }
  }

  void _previousStep() {
    _pageController.previousPage(duration: 300.ms, curve: Curves.easeInOut);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // Background Blobs
          Positioned(
            bottom: -100,
            left: -50,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.secondary.withOpacity(0.08),
              ),
            ),
          ).animate().fadeIn(duration: 1.seconds).scale(),

          Column(
            children: [
              const SizedBox(height: 60),
              // Step Indicator
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Row(
                  children: [
                    _buildStepIndicator(1, _currentStep >= 0),
                    Expanded(child: Container(height: 2, color: _currentStep >= 1 ? AppColors.primary : Colors.white10)),
                    _buildStepIndicator(2, _currentStep >= 1),
                  ],
                ),
              ),
              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  onPageChanged: (idx) => setState(() => _currentStep = idx),
                  children: [
                    _buildStep1(),
                    _buildStep2(),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStepIndicator(int step, bool active) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: active ? AppColors.primary : Colors.white10,
        border: Border.all(color: active ? AppColors.primary.withOpacity(0.5) : Colors.white24, width: 2),
      ),
      child: Center(
        child: Text(
          step.toString(),
          style: TextStyle(color: active ? Colors.white : Colors.white38, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildStep1() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 32),
      child: Column(
        children: [
          // Logo Circle
          Container(
            width: 100,
            height: 100,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [Color(0xFF8B5CF6), Color(0xFF6366F1)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: const Center(
              child: Icon(LucideIcons.userPlus, size: 48, color: Colors.white),
            ),
          ).animate().fadeIn().scale(),
          
          const SizedBox(height: 32),
          
          const Text(
            'إنشاء حساب جديد',
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          
          const SizedBox(height: 8),
          
          const Text(
            'أدخل معلوماتك الشخصية للبدء',
            style: TextStyle(color: AppColors.textDim, fontSize: 16),
          ),
          
          const SizedBox(height: 40),
          
          _buildModernTextField(_fullNameController, 'الاسم الكامل', LucideIcons.user),
          const SizedBox(height: 16),
          _buildModernTextField(_usernameController, 'اسم المستخدم', LucideIcons.atSign),
          const SizedBox(height: 16),
          _buildModernTextField(_emailController, 'البريد الإلكتروني', LucideIcons.mail),
          const SizedBox(height: 16),
          _buildModernTextField(_passwordController, 'كلمة المرور', LucideIcons.lock, isPassword: true),
          
          const SizedBox(height: 40),
          
          _buildPrimaryButton('المتابعة', _nextStep),
          
          const SizedBox(height: 24),
          
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextButton(
                onPressed: () => context.go('/login'),
                child: const Text('سجل دخولك', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
              ),
              const Text('لديك حساب بالفعل؟', style: TextStyle(color: AppColors.textDim)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStep2() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          IconButton(
            alignment: Alignment.centerRight,
            onPressed: _previousStep,
            icon: const Icon(LucideIcons.arrowRight, color: Colors.white),
          ),
          
          const SizedBox(height: 16),
          
          const Text(
            'معلومات الدراسة',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          
          const SizedBox(height: 12),
          
          const Text(
            'حدد جامعتك وتخصصك للانضمام لدفعتك',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.textDim, fontSize: 16),
          ),
          
          const SizedBox(height: 40),
          
          const Text('الجامعة', textAlign: TextAlign.right, style: TextStyle(color: AppColors.textDim, fontSize: 14)),
          const SizedBox(height: 8),
          _buildModernDropdown(_selectedUniversity, _universities, (v) => setState(() => _selectedUniversity = v)),
          
          const SizedBox(height: 20),
          
          const Text('التخصص', textAlign: TextAlign.right, style: TextStyle(color: AppColors.textDim, fontSize: 14)),
          const SizedBox(height: 8),
          _buildModernDropdown(_selectedMajor, _majors, (v) => setState(() => _selectedMajor = v)),
          
          const SizedBox(height: 20),
          
          const Text('سنة التخرج المتوقعة', textAlign: TextAlign.right, style: TextStyle(color: AppColors.textDim, fontSize: 14)),
          const SizedBox(height: 8),
          _buildModernTextField(_yearController, 'مثال: 2026', LucideIcons.calendar),
          
          const SizedBox(height: 48),
          
          _buildPrimaryButton(
            _isLoading ? 'جاري إنشاء الحساب...' : 'إكمال التسجيل',
            _isLoading ? () {} : _handleRegister
          ),
        ],
      ),
    );
  }

  Widget _buildModernTextField(TextEditingController controller, String label, IconData icon, {bool isPassword = false}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: TextField(
        controller: controller,
        obscureText: isPassword,
        textAlign: TextAlign.right,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          hintText: label,
          hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 14),
          prefixIcon: Icon(icon, size: 20, color: AppColors.primary.withOpacity(0.7)),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        ),
      ),
    );
  }

  Widget _buildModernDropdown(String? value, List<String> items, Function(String?) onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          dropdownColor: AppColors.surface,
          icon: const Icon(LucideIcons.chevronDown, color: AppColors.textMuted),
          items: items.map((e) => DropdownMenuItem(
            value: e,
            child: Text(e, textAlign: TextAlign.right, style: const TextStyle(color: Colors.white)),
          )).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildPrimaryButton(String text, VoidCallback onPressed) {
    return Container(
      width: double.infinity,
      height: 60,
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
        child: _isLoading 
          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
          : Text(
              text,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
            ),
      ),
    );
  }
}
