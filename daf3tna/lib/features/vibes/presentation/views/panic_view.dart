import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/vibes/data/vibes_repository.dart';
import 'package:daf3tna/features/vibes/presentation/vibes_provider.dart';
import 'package:daf3tna/core/utils/toast_service.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:daf3tna/features/auth/presentation/auth_provider.dart';

class PanicView extends ConsumerStatefulWidget {
  final List<Color> colors;
  const PanicView({super.key, required this.colors});

  @override
  ConsumerState<PanicView> createState() => _PanicViewState();
}

class _PanicViewState extends ConsumerState<PanicView> {
  final TextEditingController _controller = TextEditingController();
  final Map<String, TextEditingController> _replyControllers = {};
  bool _isSubmitting = false;

  @override
  void dispose() {
    _controller.dispose();
    for (var c in _replyControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final panicsAsync = ref.watch(panicsProvider);
    final user = ref.watch(currentUserProvider);

    return Column(
      children: [
        _buildHeader(),
        Expanded(
          child: panicsAsync.when(
            data: (items) {
              if (items.isEmpty) return _buildEmptyState();
              return RefreshIndicator(
                onRefresh: () => ref.refresh(panicsProvider.future),
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: items.length,
                  itemBuilder: (context, index) => _buildPanicCard(items[index], user?.id),
                ),
              );
            },
            loading: () => const Center(child: CircularProgressIndicator(color: Colors.red)),
            error: (e, _) => Center(child: Text('خطأ في تحميل البيانات', style: TextStyle(color: Colors.white.withValues(alpha: 0.5)))),
          ),
        ),
        _buildBottomInput(),
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
      ),
      child: Column(
        children: [
          const Icon(LucideIcons.alertTriangle, size: 48, color: Colors.white),
          const SizedBox(height: 16),
          const Text(
            'ساحة الفزعة (Panics)',
            style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'زملائك دائماً بجانبك في الأوقات الصعبة',
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
          Icon(LucideIcons.alertCircle, size: 80, color: Colors.red.withValues(alpha: 0.2)),
          const SizedBox(height: 16),
          Text('لا توجد طلبات فزعة حالياً.', style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 16)),
        ],
      ),
    );
  }

  Widget _buildPanicCard(dynamic item, String? currentUserId) {
    final replies = (item['replies'] as List?) ?? [];
    final isOwner = item['author']?['_id'] == currentUserId;

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: const Color(0xFF991B1B).withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: Colors.red.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.red.withValues(alpha: 0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (isOwner)
                      IconButton(
                        icon: const Icon(LucideIcons.trash2, color: Colors.red, size: 18),
                        onPressed: () => _confirmDelete(item['_id']),
                      ),
                    const Spacer(),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          item['author']?['fullName'] ?? 'زميل',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          timeago.format(DateTime.parse(item['createdAt']), locale: 'ar'),
                          style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 11),
                        ),
                      ],
                    ),
                    const SizedBox(width: 12),
                    CircleAvatar(
                      radius: 22,
                      backgroundColor: Colors.red.withValues(alpha: 0.1),
                      backgroundImage: CachedNetworkImageProvider(
                        item['author']?['avatarUrl'] ?? 'https://ui-avatars.com/api/?name=U',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  item['text'],
                  textAlign: TextAlign.right,
                  style: const TextStyle(color: Colors.white, fontSize: 16, height: 1.6),
                ),
              ],
            ),
          ),
          
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.3),
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(28)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(
                      '${replies.length} ردود ومساعدات',
                      style: const TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(width: 8),
                    const Icon(LucideIcons.messageCircle, size: 14, color: Colors.red),
                  ],
                ),
                if (replies.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  ...replies.map((r) => _buildReplyItem(r)),
                ],
                const SizedBox(height: 12),
                _buildReplyInput(item['_id']),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReplyItem(dynamic r) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    r['user']?['fullName'] ?? 'زميل',
                    style: const TextStyle(color: Colors.red, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    r['text'],
                    textAlign: TextAlign.right,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 10),
          CircleAvatar(
            radius: 14,
            backgroundImage: CachedNetworkImageProvider(
              r['user']?['avatarUrl'] ?? 'https://ui-avatars.com/api/?name=U',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReplyInput(String id) {
    if (!_replyControllers.containsKey(id)) {
      _replyControllers[id] = TextEditingController();
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(LucideIcons.send, size: 18, color: Colors.red),
            onPressed: () => _submitReply(id),
          ),
          Expanded(
            child: TextField(
              controller: _replyControllers[id],
              textAlign: TextAlign.right,
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: const InputDecoration(
                hintText: 'اكتب ردك أو مساعدتك...',
                hintStyle: TextStyle(color: AppColors.textDim, fontSize: 12),
                border: InputBorder.none,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomInput() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
      ),
      child: SafeArea(
        child: Row(
          children: [
            Container(
              decoration: BoxDecoration(
                color: Colors.red,
                borderRadius: BorderRadius.circular(12),
              ),
              child: IconButton(
                onPressed: _isSubmitting ? null : _submitPanic,
                icon: _isSubmitting 
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Icon(LucideIcons.zap, color: Colors.white),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: TextField(
                  controller: _controller,
                  textAlign: TextAlign.right,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'ما هي مشكلتك؟ (اطلب فزعة)',
                    hintStyle: TextStyle(color: AppColors.textDim),
                    border: InputBorder.none,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _submitPanic() async {
    if (_controller.text.trim().isEmpty) return;
    setState(() => _isSubmitting = true);
    try {
      await ref.read(vibesRepositoryProvider).addVibe('panic', _controller.text.trim());
      _controller.clear();
      ref.invalidate(panicsProvider);
      ToastService.showSuccess(context, 'تم إرسال الفزعة بنجاح! 🚀');
    } catch (_) {
      ToastService.showError(context, 'فشل في إرسال الفزعة');
    }
    setState(() => _isSubmitting = false);
  }

  void _submitReply(String id) async {
    final text = _replyControllers[id]?.text.trim() ?? '';
    if (text.isEmpty) return;
    try {
      await ref.read(vibesRepositoryProvider).replyPanic(id, text);
      _replyControllers[id]?.clear();
      ref.invalidate(panicsProvider);
      ToastService.showSuccess(context, 'تم إرسال الرد بنجاح');
    } catch (_) {
      ToastService.showError(context, 'فشل في إرسال الرد');
    }
  }

  void _confirmDelete(String id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('حذف الفزعة؟', textAlign: TextAlign.right, style: TextStyle(color: Colors.white)),
        content: const Text('هل أنت متأكد من حذف هذا الطلب؟', textAlign: TextAlign.right, style: TextStyle(color: AppColors.textDim)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('إلغاء')),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await ref.read(vibesRepositoryProvider).deletePanic(id);
              ref.invalidate(panicsProvider);
              ToastService.showSuccess(context, 'تم الحذف بنجاح');
            },
            child: const Text('حذف', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
