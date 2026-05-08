import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/vibes/data/vibes_repository.dart';
import 'package:daf3tna/features/vibes/presentation/vibes_provider.dart';
import 'package:daf3tna/core/utils/toast_service.dart';
import 'package:daf3tna/features/auth/presentation/auth_provider.dart';
import 'package:intl/intl.dart' as intl;

class ConfessionsView extends ConsumerStatefulWidget {
  final List<Color> colors;
  const ConfessionsView({super.key, required this.colors});

  @override
  ConsumerState<ConfessionsView> createState() => _ConfessionsViewState();
}

class _ConfessionsViewState extends ConsumerState<ConfessionsView> {
  final TextEditingController _controller = TextEditingController();
  bool _isSending = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final confessionsAsync = ref.watch(confessionsProvider);

    return Column(
      children: [
        _buildHeader(),
        Expanded(
          child: confessionsAsync.when(
            data: (items) {
              if (items.isEmpty) return _buildEmptyState();
              return RefreshIndicator(
                onRefresh: () => ref.refresh(confessionsProvider.future),
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: items.length,
                  itemBuilder: (context, index) => _buildConfessionCard(items[index]),
                ),
              );
            },
            loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFFD946EF))),
            error: (e, _) => const Center(child: Text('خطأ في تحميل البيانات', style: TextStyle(color: Colors.white24))),
          ),
        ),
        _buildInputArea(),
      ],
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: widget.colors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: widget.colors.first.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          )
        ],
      ),
      child: Column(
        children: [
          const Icon(LucideIcons.ghost, size: 48, color: Colors.white),
          const SizedBox(height: 16),
          const Text(
            'الغرفة السرية (المجهول)',
            style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'لن يعرف أحد هويتك أبداً. يتم تشفير المرسل.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.ghost, size: 80, color: const Color(0xFFD946EF).withValues(alpha: 0.1)),
          const SizedBox(height: 16),
          const Text('لا توجد اعترافات حالياً.', style: TextStyle(color: Colors.white24, fontSize: 16)),
        ],
      ),
    );
  }

  Widget _buildConfessionCard(dynamic item) {
    final date = DateTime.parse(item['createdAt']);
    final formattedDate = intl.DateFormat('yyyy/MM/dd hh:mm a', 'ar').format(date);

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFFD946EF).withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFD946EF).withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFD946EF).withValues(alpha: 0.02),
            blurRadius: 15,
            offset: const Offset(0, 5),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (['superadmin', 'admin', 'moderator'].contains(ref.watch(authProvider).user?.role))
                IconButton(
                  onPressed: () => _handleDelete(item['_id']),
                  icon: const Icon(LucideIcons.trash2, color: Colors.redAccent, size: 20),
                ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'ANONYMOUS',
                    style: TextStyle(color: Color(0xFFD946EF), fontWeight: FontWeight.bold, letterSpacing: 2, fontSize: 10),
                  ),
                  const SizedBox(width: 8),
                  const Icon(LucideIcons.ghost, size: 16, color: Color(0xFFD946EF)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            item['text'],
            textAlign: TextAlign.right,
            style: const TextStyle(color: Colors.white, fontSize: 17, height: 1.6),
          ),
          const SizedBox(height: 20),
          Text(
            formattedDate,
            style: TextStyle(color: Colors.white.withValues(alpha: 0.3), fontSize: 11),
          ),
        ],
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: const Color(0xFFD946EF).withValues(alpha: 0.2))),
      ),
      child: SafeArea(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFD946EF).withValues(alpha: 0.2)),
              ),
              child: Row(
                children: [
                  IconButton(
                    onPressed: _isSending ? null : _handleSend,
                    icon: _isSending 
                      ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Color(0xFFD946EF), strokeWidth: 2))
                      : Icon(LucideIcons.send, color: _controller.text.isNotEmpty ? const Color(0xFFD946EF) : Colors.white24),
                  ),
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      textAlign: TextAlign.right,
                      style: const TextStyle(color: Colors.white, fontSize: 16),
                      onChanged: (v) => setState(() {}),
                      decoration: const InputDecoration(
                        hintText: 'اكتب فضفضة أو رسالة سرية...',
                        hintStyle: TextStyle(color: AppColors.textDim, fontSize: 14),
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                  const Icon(LucideIcons.ghost, color: Colors.white24, size: 20),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'لن يعرف أحد هويتك أبداً. يتم تشفير البيانات بالكامل.',
              style: TextStyle(color: Colors.white.withValues(alpha: 0.3), fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }

  void _handleSend() async {
    if (_controller.text.trim().isEmpty || _isSending) return;
    setState(() => _isSending = true);
    try {
      await ref.read(vibesRepositoryProvider).addVibe('confessions', _controller.text.trim());
      _controller.clear();
      ref.invalidate(confessionsProvider);
      ToastService.showSuccess(context, 'تم النشر بنجاح! 👻');
    } catch (_) {
      ToastService.showError(context, 'فشل في نشر الاعتراف');
    }
    setState(() => _isSending = false);
  }

  void _handleDelete(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('حذف الاعتراف', style: TextStyle(color: Colors.white)),
        content: const Text('هل أنت متأكد من حذف هذا الاعتراف؟', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('إلغاء')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('حذف', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await ref.read(vibesRepositoryProvider).deleteConfession(id);
        ref.invalidate(confessionsProvider);
        ToastService.showSuccess(context, 'تم حذف الاعتراف');
      } catch (_) {
        ToastService.showError(context, 'فشل حذف الاعتراف');
      }
    }
  }
}
