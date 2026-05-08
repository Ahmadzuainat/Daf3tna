import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/vibes/data/vibes_repository.dart';
import 'package:daf3tna/features/vibes/presentation/vibes_provider.dart';
import 'package:daf3tna/core/utils/toast_service.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:daf3tna/features/search/data/search_repository.dart';
import 'package:daf3tna/features/auth/presentation/auth_provider.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart';

class AwardsView extends ConsumerStatefulWidget {
  final List<Color> colors;
  const AwardsView({super.key, required this.colors});

  @override
  ConsumerState<AwardsView> createState() => _AwardsViewState();
}

class _AwardsViewState extends ConsumerState<AwardsView> {
  @override
  Widget build(BuildContext context) {
    final awardsAsync = ref.watch(awardsProvider);
    final user = ref.watch(currentUserProvider);

    return Column(
      children: [
        _buildHeader(),
        Expanded(
          child: awardsAsync.when(
            data: (items) {
              if (items.isEmpty) return _buildEmptyState();
              return RefreshIndicator(
                onRefresh: () => ref.refresh(awardsProvider.future),
                child: ListView.builder(
                  padding: const EdgeInsets.all(24),
                  itemCount: items.length,
                  itemBuilder: (context, index) => _buildAwardCard(items[index], index, user?.id),
                ),
              );
            },
            loading: () => const Center(child: CircularProgressIndicator(color: Colors.amber)),
            error: (e, _) => const Center(child: Text('خطأ في تحميل البيانات', style: TextStyle(color: Colors.white38))),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(24),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(50),
              boxShadow: [
                BoxShadow(
                  color: Colors.amber.withValues(alpha: 0.3),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                )
              ],
            ),
            child: ElevatedButton.icon(
              onPressed: _showNominationDialog,
              icon: const Icon(LucideIcons.plus, size: 20),
              label: const Text('فتح تصويت للقب جديد 🏆', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.amber,
                foregroundColor: Colors.black,
                minimumSize: const Size(double.infinity, 60),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(50)),
                elevation: 0,
              ),
            ),
          ),
        ),
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
          const Icon(LucideIcons.crown, size: 60, color: Colors.white),
          const SizedBox(height: 16),
          const Text(
            'أساطير الدفعة',
            style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'صوّت لأكثر المواقف والشخصيات تميزاً',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 14),
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
          Icon(LucideIcons.crown, size: 80, color: Colors.amber.withValues(alpha: 0.1)),
          const SizedBox(height: 16),
          const Text('لا توجد ترشيحات حالياً.', style: TextStyle(color: Colors.white38, fontSize: 16)),
        ],
      ),
    );
  }

  Widget _buildAwardCard(dynamic item, int index, String? currentUserId) {
    final votes = (item['votes'] as List?) ?? [];
    final alreadyVoted = votes.any((v) => (v is Map ? v['_id'] : v).toString() == currentUserId);

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      child: Stack(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(32),
              border: Border.all(
                color: alreadyVoted 
                  ? Colors.green.withValues(alpha: 0.4) 
                  : Colors.amber.withValues(alpha: 0.2),
              ),
              boxShadow: [
                BoxShadow(
                  color: (alreadyVoted ? Colors.green : Colors.amber).withValues(alpha: 0.05),
                  blurRadius: 30,
                  spreadRadius: -10,
                )
              ],
            ),
            child: Row(
              children: [
                _VoteButton(
                  count: votes.length, 
                  isVoted: alreadyVoted,
                  onVote: alreadyVoted ? null : () => _handleVote(item['_id']),
                ),
                const Spacer(),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'اللــقــب', 
                        style: TextStyle(color: Colors.amber, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '"${item['title']}"', 
                        textAlign: TextAlign.right, 
                        maxLines: 2, 
                        overflow: TextOverflow.ellipsis, 
                        style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'المرشح: ${item['user']?['fullName'] ?? 'مستخدم'}', 
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 13),
                      ),
                      if (alreadyVoted)
                        Padding(
                          padding: const EdgeInsets.only(top: 8.0),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              const Text('✓ صوتت بالفعل', style: TextStyle(color: Colors.green, fontSize: 11, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 20),
                Container(
                  width: 70, height: 70,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.amber, width: 2),
                    boxShadow: [BoxShadow(color: Colors.amber.withValues(alpha: 0.2), blurRadius: 10)],
                    image: DecorationImage(
                      image: CachedNetworkImageProvider(item['user']?['avatarUrl'] ?? 'https://ui-avatars.com/api/?name=U'),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            left: 20, top: 10,
            child: Text(
              '#${index + 1}', 
              style: TextStyle(color: Colors.white.withValues(alpha: 0.05), fontSize: 72, fontWeight: FontWeight.w900),
            ),
          ),
          if (ref.watch(currentUserProvider)?.role == 'superadmin' || 
              ref.watch(currentUserProvider)?.role == 'admin' ||
              ref.watch(currentUserProvider)?.role == 'moderator')
            Positioned(
              top: 12,
              left: 12,
              child: IconButton(
                icon: const Icon(LucideIcons.trash2, color: Colors.redAccent, size: 20),
                style: IconButton.styleFrom(
                  backgroundColor: Colors.red.withValues(alpha: 0.1),
                  padding: const EdgeInsets.all(8),
                ),
                onPressed: () => _handleDelete(item['_id']),
              ),
            ),
        ],
      ),
    );
  }

  void _showNominationDialog() async {
    final users = await ref.read(searchRepositoryProvider).getBatchUsers();
    if (!mounted) return;

    String? selectedUserId;
    String duration = '24h';
    final titleController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => Container(
          height: MediaQuery.of(context).size.height * 0.85,
          decoration: const BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
          ),
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(LucideIcons.x, color: Colors.white)),
                  const Text('ترشيح لقب جديد 🏆', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(height: 24),
              const Text('اسم اللقب (مثال: أسرع واحد بنام)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextField(
                controller: titleController,
                textAlign: TextAlign.right,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'اكتب اللقب هنا...',
                  hintStyle: const TextStyle(color: AppColors.textDim),
                  filled: true,
                  fillColor: Colors.white.withValues(alpha: 0.05),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 24),
              const Text('اختر الزميل المرشح', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: ListView.builder(
                    itemCount: users.length,
                    itemBuilder: (context, index) {
                      final u = users[index];
                      final isSelected = selectedUserId == u.id;
                      return ListTile(
                        onTap: () => setDialogState(() => selectedUserId = u.id),
                        selected: isSelected,
                        selectedTileColor: Colors.amber.withValues(alpha: 0.1),
                        trailing: CircleAvatar(backgroundImage: CachedNetworkImageProvider(u.avatarUrl ?? 'https://ui-avatars.com/api/?name=U')),
                        title: Text(u.fullName, textAlign: TextAlign.right, style: TextStyle(color: isSelected ? Colors.amber : Colors.white)),
                        leading: isSelected ? const Icon(LucideIcons.check, color: Colors.amber) : null,
                      );
                    },
                  ),
                ),
              ),
              const SizedBox(height: 24),
              const Text('مدة التصويت', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Row(
                children: [
                  _buildDurationChip('أسبوع', '1week', duration, (val) => setDialogState(() => duration = val)),
                  const SizedBox(width: 8),
                  _buildDurationChip('3 أيام', '3days', duration, (val) => setDialogState(() => duration = val)),
                  const SizedBox(width: 8),
                  _buildDurationChip('24 ساعة', '24h', duration, (val) => setDialogState(() => duration = val)),
                ],
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: (selectedUserId == null || titleController.text.isEmpty) ? null : () async {
                  await ref.read(vibesRepositoryProvider).addVibe(
                    'awards', 
                    titleController.text, 
                    extraData: {'userId': selectedUserId, 'duration': duration}
                  );
                  Navigator.pop(context);
                  ref.invalidate(awardsProvider);
                  ToastService.showSuccess(context, 'تمت إضافة الترشيح بنجاح! 🏆');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.amber,
                  minimumSize: const Size(double.infinity, 56),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('نشر التصويت الآن', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDurationChip(String label, String value, String selected, Function(String) onSelect) {
    final isSelected = selected == value;
    return Expanded(
      child: GestureDetector(
        onTap: () => onSelect(value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? Colors.amber : Colors.white.withValues(alpha: 0.05),
            borderRadius: BorderRadius.circular(12),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(color: isSelected ? Colors.black : Colors.white, fontWeight: FontWeight.bold),
          ),
        ),
      ),
    );
  }

  void _handleVote(String id) async {
    try {
      await ref.read(vibesRepositoryProvider).voteVibe('awards', id);
      ref.invalidate(awardsProvider);
      ToastService.showSuccess(context, 'تم التصويت بنجاح! 🏆');
    } catch (e) {
      ToastService.showError(context, 'لقد صوّت بالفعل لهذا اللقب');
    }
  }

  void _handleDelete(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('حذف الجائزة', style: TextStyle(color: Colors.white)),
        content: const Text('هل أنت متأكد من حذف هذه الجائزة؟ لا يمكن التراجع عن هذا الفعل.', style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('إلغاء')),
          TextButton(
            onPressed: () => Navigator.pop(context, true), 
            child: const Text('حذف', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await ref.read(vibesRepositoryProvider).deleteAward(id);
      ref.invalidate(awardsProvider);
      if (mounted) ToastService.showSuccess(context, 'تم حذف الجائزة بنجاح');
    } catch (e) {
      if (mounted) ToastService.showError(context, 'فشل حذف الجائزة');
    }
  }
}

class _VoteButton extends StatelessWidget {
  final int count;
  final bool isVoted;
  final VoidCallback? onVote;
  const _VoteButton({required this.count, required this.isVoted, this.onVote});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onVote,
      child: Container(
        width: 60,
        height: 80,
        decoration: BoxDecoration(
          color: isVoted ? Colors.green.withValues(alpha: 0.1) : Colors.amber.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: (isVoted ? Colors.green : Colors.amber).withValues(alpha: 0.3)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.star, color: isVoted ? Colors.green : Colors.amber, size: 24, fill: isVoted ? 1.0 : 0.0),
            const SizedBox(height: 4),
            Text(
              '$count', 
              style: TextStyle(color: isVoted ? Colors.green : Colors.amber, fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
      ),
    );
  }
}
