import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/vibes/data/vibes_repository.dart';
import 'package:daf3tna/features/vibes/presentation/vibes_provider.dart';
import 'package:daf3tna/core/utils/toast_service.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:daf3tna/features/auth/presentation/auth_provider.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart';
import 'package:intl/intl.dart' as intl;

class NotebooksView extends ConsumerStatefulWidget {
  final List<Color> colors;
  const NotebooksView({super.key, required this.colors});

  @override
  ConsumerState<NotebooksView> createState() => _NotebooksViewState();
}

class _NotebooksViewState extends ConsumerState<NotebooksView> {
  dynamic _selectedNotebook;
  final TextEditingController _signController = TextEditingController();
  bool _isSigning = false;

  @override
  void dispose() {
    _signController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_selectedNotebook != null) return _buildDetailView();

    final notebooksAsync = ref.watch(notebookProvider);

    return Column(
      children: [
        _buildHeader(),
        Expanded(
          child: notebooksAsync.when(
            data: (items) {
              final publicItems = items.where((nb) => nb['isPublic'] != false).toList();
              if (publicItems.isEmpty) return _buildEmptyState();
              return RefreshIndicator(
                onRefresh: () => ref.refresh(notebookProvider.future),
                child: GridView.builder(
                  padding: const EdgeInsets.all(24),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.7,
                    crossAxisSpacing: 20,
                    mainAxisSpacing: 30,
                  ),
                  itemCount: publicItems.length,
                  itemBuilder: (context, index) => _buildNotebookBook(publicItems[index]),
                ),
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => const Center(child: Text('خطأ في تحميل البيانات', style: TextStyle(color: Colors.white24))),
          ),
        ),
        _buildOpenMyNotebookButton(),
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
          const Icon(LucideIcons.book, size: 48, color: Colors.white),
          const SizedBox(height: 16),
          const Text(
            'كتاب التخرج (Yearbook)',
            style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'اترك ذكرى لزملائك واقرأ ما كتبوه لك',
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
          Icon(LucideIcons.book, size: 80, color: Colors.white.withValues(alpha: 0.05)),
          const SizedBox(height: 16),
          const Text('لا توجد دفاتر متاحة حالياً.', style: TextStyle(color: Colors.white24)),
        ],
      ),
    );
  }

  Widget _buildNotebookBook(dynamic nb) {
    final color = _parseColor(nb['color']);
    return GestureDetector(
      onTap: () => setState(() => _selectedNotebook = nb),
      child: Column(
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: color,
                borderRadius: const BorderRadius.horizontal(left: Radius.circular(4), right: Radius.circular(12)),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.5), blurRadius: 15, offset: const Offset(0, 10))
                ],
                border: const Border(left: BorderSide(color: Colors.white10, width: 3)),
              ),
              child: Center(
                child: Container(
                  width: 50, height: 50,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    image: DecorationImage(
                      image: CachedNetworkImageProvider(nb['owner']?['avatarUrl'] ?? 'https://ui-avatars.com/api/?name=U'),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            nb['owner']?['fullName'] ?? '', 
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
            maxLines: 1, overflow: TextOverflow.ellipsis,
          ),
          Text(
            nb['title'] ?? 'IT', 
            style: const TextStyle(color: AppColors.textDim, fontSize: 11),
          ),
        ],
      ),
    );
  }

  Widget _buildOpenMyNotebookButton() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(50),
          boxShadow: [
            BoxShadow(color: AppColors.primary.withValues(alpha: 0.3), blurRadius: 20, offset: const Offset(0, 10))
          ],
        ),
        child: ElevatedButton.icon(
          onPressed: _openSettings,
          icon: const Icon(LucideIcons.edit3),
          label: const Text('افتح دفتري الخاص', style: TextStyle(fontWeight: FontWeight.bold)),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            minimumSize: const Size(double.infinity, 56),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(50)),
            elevation: 0,
          ),
        ),
      ),
    );
  }

  Widget _buildDetailView() {
    final nb = _selectedNotebook;
    final color = _parseColor(nb['color']);
    final messages = (nb['messages'] as List?) ?? [];
    final user = ref.watch(currentUserProvider);
    final isOwner = nb['owner']?['_id'] == user?.id;

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.fromLTRB(16, 48, 16, 16),
          decoration: BoxDecoration(
            color: AppColors.surface.withValues(alpha: 0.8),
            border: Border(bottom: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                icon: const Icon(LucideIcons.arrowRight, color: Colors.white), 
                onPressed: () => setState(() => _selectedNotebook = null)
              ),
              Column(
                children: [
                  Text('بواسطة ${nb['owner']?['fullName']}', style: const TextStyle(color: AppColors.textDim, fontSize: 10)),
                  Text(nb['title'] ?? 'دفتر التخرج', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(width: 48),
            ],
          ),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              // Profile Hero
              Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(32),
                  border: Border.all(color: Colors.white10),
                ),
                child: Column(
                  children: [
                    Container(height: 4, width: double.infinity, color: color),
                    const SizedBox(height: 32),
                    CircleAvatar(
                      radius: 50,
                      backgroundColor: color,
                      child: CircleAvatar(
                        radius: 47,
                        backgroundImage: CachedNetworkImageProvider(nb['owner']?['avatarUrl'] ?? 'https://ui-avatars.com/api/?name=U'),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(nb['owner']?['fullName'] ?? '', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                    Text(nb['description'] ?? 'IT • دفعة 2026', style: const TextStyle(color: AppColors.textDim)),
                    const SizedBox(height: 24),
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(color: Colors.black26, borderRadius: BorderRadius.circular(20)),
                      child: Text(
                        '"${nb['quote'] ?? 'لا يوجد اقتباس بعد'}"', 
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.white, fontStyle: FontStyle.italic, height: 1.5),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 40),
              // Messages Header
              Row(
                children: [
                  Icon(LucideIcons.book, color: color, size: 20),
                  const SizedBox(width: 10),
                  const Text('رسائل الزملاء', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                    child: Text('${messages.length}', style: const TextStyle(color: AppColors.textDim, fontSize: 12, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              // Messages List
              ...messages.map((msg) => _buildMessageCard(msg, nb, user, isOwner)),
              const SizedBox(height: 100),
            ],
          ),
        ),
        if (!isOwner) _buildSignInput(nb['_id']),
      ],
    );
  }

  Widget _buildMessageCard(dynamic msg, dynamic nb, dynamic user, bool isOwner) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Row(
            children: [
              if (msg['author']?['_id'] == user?.id || isOwner || ['superadmin', 'admin', 'moderator'].contains(user?.role))
                IconButton(
                  onPressed: () => _handleDeleteMessage(nb['_id'], msg['_id']),
                  icon: const Icon(LucideIcons.trash2, color: Colors.redAccent, size: 16),
                ),
              const Spacer(),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(msg['author']?['fullName'] ?? 'زميل', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                  Text(
                    msg['createdAt'] != null ? intl.DateFormat('yyyy/MM/dd').format(DateTime.parse(msg['createdAt'])) : '',
                    style: const TextStyle(color: AppColors.textDim, fontSize: 10),
                  ),
                ],
              ),
              const SizedBox(width: 12),
              CircleAvatar(
                radius: 18,
                backgroundImage: CachedNetworkImageProvider(msg['author']?['avatarUrl'] ?? 'https://ui-avatars.com/api/?name=U'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(msg['text'], textAlign: TextAlign.right, style: const TextStyle(color: Colors.white, height: 1.5)),
        ],
      ),
    );
  }

  Widget _buildSignInput(String notebookId) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
      ),
      child: SafeArea(
        child: Row(
          children: [
            IconButton(
              onPressed: _isSigning ? null : () => _handleSign(notebookId),
              icon: _isSigning 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
                : const Icon(LucideIcons.checkCircle2, color: AppColors.primary, size: 28),
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
                  controller: _signController,
                  textAlign: TextAlign.right,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'اترك كلمة للذكرى...',
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

  void _handleSign(String id) async {
    if (_signController.text.trim().isEmpty) return;
    setState(() => _isSigning = true);
    try {
      await ref.read(vibesRepositoryProvider).signNotebook(id, _signController.text.trim());
      _signController.clear();
      // To update the detail view locally, we'd ideally refetch or use a stream, 
      // but for now let's invalidate and maybe re-select if we wanted perfection.
      // Simple way: re-fetch notebooks
      ref.refresh(notebookProvider);
      ToastService.showSuccess(context, 'تم التوقيع بنجاح! ✍️');
      // For immediate UI update, we'd need a more complex state management.
    } catch (_) {
      ToastService.showError(context, 'فشل في التوقيع');
    }
    setState(() => _isSigning = false);
  }

  void _handleDeleteNotebook(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('حذف الدفتر', style: TextStyle(color: Colors.white)),
        content: const Text('هل أنت متأكد من حذف هذا الدفتر بالكامل؟', style: TextStyle(color: Colors.white70)),
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
        await ref.read(vibesRepositoryProvider).deleteNotebook(id);
        ref.invalidate(notebookProvider);
        ToastService.showSuccess(context, 'تم حذف الدفتر');
      } catch (_) {
        ToastService.showError(context, 'فشل حذف الدفتر');
      }
    }
  }

  void _handleDeleteMessage(String notebookId, String msgId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('حذف الرسالة', style: TextStyle(color: Colors.white)),
        content: const Text('هل أنت متأكد من حذف هذه الرسالة؟', style: TextStyle(color: Colors.white70)),
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
        await ref.read(vibesRepositoryProvider).deleteNotebookMessage(notebookId, msgId);
        ref.invalidate(notebookProvider);
        if (_selectedNotebook != null) {
          setState(() {
            _selectedNotebook['messages'] = (_selectedNotebook['messages'] as List).where((m) => m['_id'] != msgId).toList();
          });
        }
        ToastService.showSuccess(context, 'تم حذف الرسالة');
      } catch (_) {
        ToastService.showError(context, 'فشل حذف الرسالة');
      }
    }
  }

  void _openSettings() {
    // Navigate to settings or show dialog
    ToastService.showInfo(context, 'إعدادات الدفتر قيد التحسين...');
  }

  Color _parseColor(dynamic color) {
    if (color == null) return const Color(0xFF1E3A8A);
    if (color is String) {
      if (color.startsWith('#')) {
        return Color(int.parse(color.substring(1), radix: 16) + 0xFF000000);
      }
    }
    return const Color(0xFF1E3A8A);
  }
}
