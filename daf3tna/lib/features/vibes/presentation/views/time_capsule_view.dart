import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/vibes/data/vibes_repository.dart';
import 'package:daf3tna/features/vibes/presentation/vibes_provider.dart';
import 'package:daf3tna/core/utils/toast_service.dart';
import 'package:intl/intl.dart' as intl;

class TimeCapsuleView extends ConsumerStatefulWidget {
  final List<Color> colors;
  const TimeCapsuleView({super.key, required this.colors});

  @override
  ConsumerState<TimeCapsuleView> createState() => _TimeCapsuleViewState();
}

class _TimeCapsuleViewState extends ConsumerState<TimeCapsuleView> {
  bool _showAdd = false;
  final TextEditingController _textController = TextEditingController();
  DateTime _unlockDate = DateTime.now().add(const Duration(days: 60));
  bool _isPublic = true;
  late Timer _timer;
  Duration _timeLeft = const Duration();

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  @override
  void dispose() {
    _timer.cancel();
    _textController.dispose();
    super.dispose();
  }

  void _startCountdown() {
    final target = DateTime(2026, 7, 1);
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      final now = DateTime.now();
      final diff = target.difference(now);
      setState(() {
        _timeLeft = diff.isNegative ? Duration.zero : diff;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final capsulesAsync = ref.watch(timeCapsulesProvider);

    return Container(
      decoration: const BoxDecoration(
        gradient: RadialGradient(
          center: Alignment.center,
          radius: 1.5,
          colors: [Color(0xFF064E3B), AppColors.background],
        ),
      ),
      child: Column(
        children: [
          _buildHeader(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  if (_showAdd) _buildAddForm() else ...[
                    _buildHeroSection(),
                    const SizedBox(height: 48),
                    _buildCountdown(),
                    const SizedBox(height: 48),
                    _buildActionButton(),
                    const SizedBox(height: 48),
                    _buildMyCapsules(capsulesAsync),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 48, 24, 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          const Text(
            'الكبسولة الزمنية',
            style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(width: 16),
          if (_showAdd)
            IconButton(
              icon: const Icon(LucideIcons.arrowRight, color: Colors.white),
              onPressed: () => setState(() => _showAdd = false),
            ),
        ],
      ),
    );
  }

  Widget _buildHeroSection() {
    return Column(
      children: [
        Icon(
          LucideIcons.lock, 
          size: 80, 
          color: const Color(0xFF10B981),
          shadows: [Shadow(color: const Color(0xFF10B981).withValues(alpha: 0.4), blurRadius: 40)],
        ),
        const SizedBox(height: 24),
        const Text(
          'الكبسولة الزمنية',
          style: TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Text(
          'تم إغلاق الكبسولة آلياً ولن تفتح إلا في يوم حفل التخرج لدفعة 2026.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 15, height: 1.5),
        ),
      ],
    );
  }

  Widget _buildCountdown() {
    final days = _timeLeft.inDays;
    final hours = _timeLeft.inHours % 24;
    final minutes = _timeLeft.inMinutes % 60;
    final seconds = _timeLeft.inSeconds % 60;

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _buildTimeBox(days.toString().padLeft(2, '0'), 'يوم'),
        const SizedBox(width: 12),
        _buildTimeBox(hours.toString().padLeft(2, '0'), 'ساعة'),
        const SizedBox(width: 12),
        _buildTimeBox(minutes.toString().padLeft(2, '0'), 'دقيقة'),
        const SizedBox(width: 12),
        _buildTimeBox(seconds.toString().padLeft(2, '0'), 'ثانية'),
      ],
    );
  }

  Widget _buildTimeBox(String value, String label) {
    return Column(
      children: [
        Container(
          width: 70,
          height: 80,
          decoration: BoxDecoration(
            color: const Color(0xFF064E3B).withValues(alpha: 0.6),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFF10B981), width: 2),
            boxShadow: [BoxShadow(color: const Color(0xFF10B981).withValues(alpha: 0.3), blurRadius: 20)],
          ),
          alignment: Alignment.center,
          child: Text(
            value,
            style: const TextStyle(color: Color(0xFF10B981), fontSize: 32, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(height: 8),
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildActionButton() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(40),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.3),
            blurRadius: 30,
            offset: const Offset(0, 10),
          )
        ],
      ),
      child: ElevatedButton.icon(
        onPressed: () => setState(() => _showAdd = true),
        icon: const Icon(LucideIcons.plusSquare, color: Colors.white),
        label: const Text('إيداع رسالة جديدة للمستقبل ⏳', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 64),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(40)),
          elevation: 0,
        ),
      ),
    );
  }

  Widget _buildAddForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        const Text('أودع رسالة للمستقبل ⏳', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
        const SizedBox(height: 24),
        TextField(
          controller: _textController,
          maxLines: 6,
          textAlign: TextAlign.right,
          style: const TextStyle(color: Colors.white, fontSize: 16),
          decoration: InputDecoration(
            hintText: 'اكتب رسالتك هنا... لن يراها أحد حتى موعد الفتح.',
            hintStyle: const TextStyle(color: AppColors.textDim),
            filled: true,
            fillColor: Colors.black.withValues(alpha: 0.2),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide(color: Colors.white10)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide(color: Colors.white10)),
          ),
        ),
        const SizedBox(height: 24),
        const Text('موعد الفتح', style: TextStyle(color: AppColors.textDim, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        GestureDetector(
          onTap: _selectDate,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white10),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Icon(LucideIcons.calendar, color: Colors.white70),
                Text(
                  intl.DateFormat('yyyy/MM/dd').format(_unlockDate),
                  style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            const Text('اجعلها علنية للدفعة بعد الفتح', style: TextStyle(color: Colors.white)),
            Checkbox(
              value: _isPublic, 
              onChanged: (v) => setState(() => _isPublic = v ?? true),
              activeColor: const Color(0xFF10B981),
            ),
          ],
        ),
        const SizedBox(height: 32),
        Row(
          children: [
            Expanded(
              child: ElevatedButton(
                onPressed: _handleCreate,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  padding: const EdgeInsets.all(16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('تأكيد الإيداع 🔒', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextButton(
                onPressed: () => setState(() => _showAdd = false),
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.all(16),
                  backgroundColor: Colors.white.withValues(alpha: 0.05),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('إلغاء', style: TextStyle(color: Colors.white)),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMyCapsules(AsyncValue<List<dynamic>> capsulesAsync) {
    return capsulesAsync.when(
      data: (items) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              'رسائلك المودعة (${items.length})', 
              style: const TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 18),
            ),
            const SizedBox(height: 16),
            if (items.isEmpty)
              const Center(child: Text('لم تقم بإيداع أي رسائل بعد.', style: TextStyle(color: Colors.white38))),
            ...items.map((c) => _buildCapsuleCard(c)),
          ],
        );
      },
      loading: () => const CircularProgressIndicator(color: Color(0xFF10B981)),
      error: (e, _) => const SizedBox(),
    );
  }

  Widget _buildCapsuleCard(dynamic c) {
    final unlockDate = DateTime.parse(c['unlockDate']);
    final isLocked = unlockDate.isAfter(DateTime.now());

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(isLocked ? LucideIcons.lock : LucideIcons.check, color: isLocked ? Colors.orange : Colors.green, size: 16),
              Text(
                'فتح بتاريخ: ${intl.DateFormat('yyyy/MM/dd').format(unlockDate)}', 
                style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            isLocked ? 'محتوى مشفر ومخفي...' : c['text'],
            textAlign: TextAlign.right,
            style: TextStyle(
              color: isLocked ? Colors.white.withValues(alpha: 0.3) : Colors.white,
              fontStyle: isLocked ? FontStyle.italic : FontStyle.normal,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }

  void _selectDate() async {
    final date = await showDatePicker(
      context: context, 
      initialDate: _unlockDate,
      firstDate: DateTime.now().add(const Duration(days: 1)), 
      lastDate: DateTime(2030),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF10B981),
              surface: AppColors.surface,
            ),
          ),
          child: child!,
        );
      },
    );
    if (date != null) setState(() => _unlockDate = date);
  }

  void _handleCreate() async {
    if (_textController.text.trim().isEmpty) return;
    try {
      await ref.read(vibesRepositoryProvider).createTimeCapsule(
        _textController.text.trim(), 
        _unlockDate.toIso8601String(), 
        _isPublic
      );
      _textController.clear();
      setState(() => _showAdd = false);
      ref.invalidate(timeCapsulesProvider);
      ToastService.showSuccess(context, 'تم إيداع رسالتك في الكبسولة بنجاح! 🔒');
    } catch (_) {
      ToastService.showError(context, 'فشل في إيداع الرسالة');
    }
  }
}
