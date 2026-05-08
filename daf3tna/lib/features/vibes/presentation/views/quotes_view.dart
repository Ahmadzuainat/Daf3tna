import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/vibes/data/vibes_repository.dart';
import 'package:daf3tna/features/vibes/presentation/vibes_provider.dart';
import 'package:daf3tna/core/utils/toast_service.dart';

class QuotesView extends ConsumerStatefulWidget {
  final List<Color> colors;
  const QuotesView({super.key, required this.colors});

  @override
  ConsumerState<QuotesView> createState() => _QuotesViewState();
}

class _QuotesViewState extends ConsumerState<QuotesView> {
  final TextEditingController _textController = TextEditingController();
  final TextEditingController _doctorController = TextEditingController();
  final TextEditingController _subjectController = TextEditingController();
  bool _showAdd = false;

  @override
  void dispose() {
    _textController.dispose();
    _doctorController.dispose();
    _subjectController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final quotesAsync = ref.watch(quotesProvider);

    return Column(
      children: [
        _buildHeader(),
        if (_showAdd) _buildAddForm(),
        Expanded(
          child: quotesAsync.when(
            data: (items) {
              if (items.isEmpty) return _buildEmptyState();
              return RefreshIndicator(
                onRefresh: () => ref.refresh(quotesProvider.future),
                child: ListView.builder(
                  padding: const EdgeInsets.all(24),
                  itemCount: items.length,
                  itemBuilder: (context, index) => _buildQuoteCard(items[index], index),
                ),
              );
            },
            loading: () => const Center(child: CircularProgressIndicator(color: Colors.blue)),
            error: (e, _) => const Center(child: Text('خطأ في تحميل البيانات', style: TextStyle(color: Colors.white24))),
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
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: TextButton.icon(
              onPressed: () => setState(() => _showAdd = !_showAdd),
              icon: Icon(_showAdd ? LucideIcons.minus : LucideIcons.plus, color: Colors.white, size: 18),
              label: Text(_showAdd ? 'إغلاق' : 'إضافة +', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ),
          const Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'حائط الاقتباسات',
                style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
              ),
              Text(
                'أجمل وأغرب ما قيل في المحاضرات',
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAddForm() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: Colors.white.withValues(alpha: 0.1))),
      ),
      child: Column(
        children: [
          _buildInput(_textController, 'الاقتباس...', maxLines: 3),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _buildInput(_subjectController, 'المادة (اختياري)')),
              const SizedBox(width: 12),
              Expanded(child: _buildInput(_doctorController, 'اسم الدكتور')),
            ],
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _submitQuote,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              minimumSize: const Size(double.infinity, 50),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('نشر الاقتباس ✨', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildInput(TextEditingController ctrl, String hint, {int maxLines = 1}) {
    return TextField(
      controller: ctrl,
      maxLines: maxLines,
      textAlign: TextAlign.right,
      style: const TextStyle(color: Colors.white, fontSize: 14),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppColors.textDim, fontSize: 13),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.05),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.quote, size: 80, color: Colors.blue.withValues(alpha: 0.1)),
          const SizedBox(height: 16),
          const Text('لا توجد اقتباسات بعد.', style: TextStyle(color: Colors.white24, fontSize: 16)),
        ],
      ),
    );
  }

  Widget _buildQuoteCard(dynamic item, int index) {
    final bool isBlue = index % 2 == 0;
    return Transform.rotate(
      angle: isBlue ? -0.02 : 0.02,
      child: Container(
        margin: const EdgeInsets.only(bottom: 24),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: isBlue 
              ? [const Color(0xFFDBEAFE), const Color(0xFFBFDBFE)]
              : [const Color(0xFFFEF3C7), const Color(0xFFFDE68A)],
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.2), 
              blurRadius: 10, 
              offset: const Offset(0, 5)
            )
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Icon(
              LucideIcons.quote, 
              color: (isBlue ? Colors.blue : Colors.orange).withValues(alpha: 0.3), 
              size: 32
            ),
            const SizedBox(height: 12),
            Text(
              '"${item['text']}"', 
              textAlign: TextAlign.right, 
              style: const TextStyle(color: Color(0xFF1E3A8A), fontSize: 18, fontWeight: FontWeight.bold, height: 1.4),
            ),
            const SizedBox(height: 20),
            Container(width: double.infinity, height: 1, color: Colors.black12),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (item['subject'] != null)
                  Text(
                    item['subject'], 
                    style: TextStyle(color: const Color(0xFF1E3A8A).withValues(alpha: 0.7), fontSize: 12),
                  ),
                Text(
                  item['doctor'] ?? 'دكتور مجهول', 
                  style: const TextStyle(color: Color(0xFF1E3A8A), fontWeight: FontWeight.bold, fontSize: 15),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _submitQuote() async {
    if (_textController.text.trim().isEmpty || _doctorController.text.trim().isEmpty) {
      ToastService.showError(context, 'يرجى إكمال البيانات');
      return;
    }
    try {
      await ref.read(vibesRepositoryProvider).addVibe('quotes', _textController.text.trim(), extraData: {
        'doctor': _doctorController.text.trim(),
        'subject': _subjectController.text.trim(),
      });
      _textController.clear();
      _doctorController.clear();
      _subjectController.clear();
      setState(() => _showAdd = false);
      ref.invalidate(quotesProvider);
      ToastService.showSuccess(context, 'تمت إضافة الاقتباس بنجاح! ✨');
    } catch (_) {
      ToastService.showError(context, 'فشل في إضافة الاقتباس');
    }
  }
}
