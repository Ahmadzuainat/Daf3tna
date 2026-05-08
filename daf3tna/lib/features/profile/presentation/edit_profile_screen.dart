import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:image_picker/image_picker.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/profile/data/profile_repository.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart';
import 'package:daf3tna/models/user_model.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/services.dart';
import 'package:daf3tna/core/utils/toast_service.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  final UserModel user;
  const EditProfileScreen({super.key, required this.user});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late TextEditingController _nameController;
  late TextEditingController _bioController;
  String? _avatarPath;
  String? _coverPath;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.user.fullName);
    _bioController = TextEditingController(text: widget.user.bio);
  }

  Future<void> _pickImage(bool isAvatar) async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    if (image != null) {
      setState(() {
        if (isAvatar) {
          _avatarPath = image.path;
        } else {
          _coverPath = image.path;
        }
      });
    }
  }


  Future<void> _save() async {
    if (_nameController.text.trim().isEmpty) {
      ToastService.showError(context, 'يرجى إدخال الاسم الكامل');
      return;
    }

    HapticFeedback.mediumImpact();
    setState(() => _isLoading = true);
    try {
      final updatedUser = await ref.read(profileRepositoryProvider).updateProfile(
        fullName: _nameController.text.trim(),
        bio: _bioController.text.trim(),
        avatarPath: _avatarPath,
        coverPath: _coverPath,
      );
      
      ref.read(currentUserProvider.notifier).state = updatedUser;
      
      if (mounted) {
        ToastService.showSuccess(context, 'تم تحديث ملفك الشخصي بنجاح ✅');
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ToastService.showError(context, 'حدث خطأ أثناء التحديث، يرجى المحاولة لاحقاً');
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('تعديل الملف الشخصي', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
            )
          else
            TextButton(
              onPressed: _save,
              child: const Text('حفظ', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
            ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Cover Photo Editor
            GestureDetector(
              onTap: () => _pickImage(false),
              child: Stack(
                children: [
                  Container(
                    height: 180,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      image: _coverPath != null
                          ? DecorationImage(image: FileImage(File(_coverPath!)), fit: BoxFit.cover)
                          : widget.user.coverUrl != null
                              ? DecorationImage(image: CachedNetworkImageProvider(widget.user.coverUrl!), fit: BoxFit.cover)
                              : null,
                    ),
                    child: _coverPath == null && widget.user.coverUrl == null
                        ? const Center(child: Icon(LucideIcons.image, color: Colors.white24, size: 40))
                        : null,
                  ),
                  Container(
                    height: 180,
                    width: double.infinity,
                    color: Colors.black26,
                    child: const Center(child: Icon(LucideIcons.camera, color: Colors.white, size: 30)),
                  ),
                ],
              ),
            ),

            // Avatar Editor
            Transform.translate(
              offset: const Offset(0, -50),
              child: GestureDetector(
                onTap: () => _pickImage(true),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(color: AppColors.background, shape: BoxShape.circle),
                      child: CircleAvatar(
                        radius: 55,
                        backgroundColor: AppColors.surface,
                        backgroundImage: _avatarPath != null
                            ? FileImage(File(_avatarPath!))
                            : CachedNetworkImageProvider(widget.user.avatarUrl ?? '') as ImageProvider,
                      ),
                    ),
                    Container(
                      width: 110,
                      height: 110,
                      decoration: BoxDecoration(color: Colors.black38, shape: BoxShape.circle),
                      child: const Icon(LucideIcons.camera, color: Colors.white, size: 24),
                    ),
                  ],
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text('الاسم الكامل', style: TextStyle(color: AppColors.textDim, fontSize: 14)),
                  const SizedBox(height: 8),
                  _buildTextField(_nameController, 'أدخل اسمك الكامل'),
                  
                  const SizedBox(height: 24),
                  
                  const Text('النبذة الشخصية (Bio)', style: TextStyle(color: AppColors.textDim, fontSize: 14)),
                  const SizedBox(height: 8),
                  _buildTextField(_bioController, 'اكتب شيئاً عن نفسك...', maxLines: 3),
                  
                  const SizedBox(height: 32),
                  
                  // Info Box
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withOpacity(0.05)),
                    ),
                    child: Column(
                      children: [
                        _buildInfoRow('اسم المستخدم', '@${widget.user.username}', LucideIcons.atSign),
                        const Divider(color: Colors.white10),
                        _buildInfoRow('الكلية/التخصص', widget.user.major ?? 'غير محدد', LucideIcons.graduationCap),
                        const Divider(color: Colors.white10),
                        _buildInfoRow('رقم الدفعة', widget.user.batchId, LucideIcons.hash),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String hint, {int maxLines = 1}) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: TextField(
        controller: controller,
        textAlign: TextAlign.right,
        maxLines: maxLines,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: AppColors.textMuted),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500)),
          Row(
            children: [
              Text(label, style: const TextStyle(color: AppColors.textMuted)),
              const SizedBox(width: 8),
              Icon(icon, size: 16, color: AppColors.primary),
            ],
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _bioController.dispose();
    super.dispose();
  }
}
