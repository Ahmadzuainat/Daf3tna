import 'dart:io';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/vibes/data/vibes_repository.dart';
import 'package:daf3tna/features/vibes/presentation/vibes_provider.dart';
import 'package:daf3tna/core/utils/toast_service.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:daf3tna/features/auth/presentation/auth_provider.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart';
import 'dart:ui';

class InstantsView extends ConsumerStatefulWidget {
  final List<Color> colors;
  const InstantsView({super.key, required this.colors});

  @override
  ConsumerState<InstantsView> createState() => _InstantsViewState();
}

class _InstantsViewState extends ConsumerState<InstantsView> {
  bool _isUploading = false;

  @override
  Widget build(BuildContext context) {
    final instantsAsync = ref.watch(instantsProvider);
    final user = ref.watch(currentUserProvider);

    return Column(
      children: [
        _buildHeader(),
        Expanded(
          child: instantsAsync.when(
            data: (items) {
              return SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    _buildUploadSection(),
                    const SizedBox(height: 40),
                    const Text(
                      'لقطات الأصدقاء', 
                      style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 20),
                    if (items.isEmpty)
                      const Center(child: Text('لا توجد لقطات جديدة', style: TextStyle(color: Colors.white38)))
                    else
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          childAspectRatio: 0.8,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 24,
                        ),
                        itemCount: items.length,
                        itemBuilder: (context, index) => _buildInstantCard(items[index], user?.id),
                      ),
                  ],
                ),
              );
            },
            loading: () => const Center(child: CircularProgressIndicator(color: Colors.pink)),
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
      child: Column(
        children: [
          const Icon(LucideIcons.zap, size: 48, color: Colors.white),
          const SizedBox(height: 16),
          const Text(
            'اللقطات الفورية',
            style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'شارك لحظاتك العفوية التي تختفي بسرعة',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _buildUploadSection() {
    return Column(
      children: [
        GestureDetector(
          onTap: _isUploading ? null : _pickAndUpload,
          child: Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(colors: [Color(0xFFF97316), Color(0xFFEC4899)]),
              boxShadow: [
                BoxShadow(color: const Color(0xFFEC4899).withValues(alpha: 0.3), blurRadius: 30, spreadRadius: 5)
              ],
            ),
            child: _isUploading 
              ? const Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3))
              : const Icon(LucideIcons.camera, size: 48, color: Colors.white),
          ),
        ),
        const SizedBox(height: 16),
        const Text('شارك لحظتك', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildInstantCard(dynamic item, String? currentUserId) {
    final bool isOwner = (item['user']?['_id'] ?? item['user']).toString() == currentUserId;
    final List viewers = (item['viewers'] as List?) ?? [];
    final bool isViewed = !isOwner && viewers.contains(currentUserId);

    return GestureDetector(
      onTap: () {
        if (!isViewed) _viewInstant(item);
      },
      child: Column(
        children: [
          Stack(
            children: [
              Container(
                width: 80,
                height: 80,
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: isViewed 
                    ? LinearGradient(colors: [Colors.white10, Colors.white10])
                    : const LinearGradient(colors: [Color(0xFFF97316), Color(0xFFEC4899)]),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    image: DecorationImage(
                      image: CachedNetworkImageProvider(
                        item['user']?['avatarUrl'] ?? 'https://ui-avatars.com/api/?name=U',
                      ),
                      fit: BoxFit.cover,
                    ),
                  ),
                  child: ClipOval(
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: isViewed ? 0 : 5, sigmaY: isViewed ? 0 : 5),
                      child: Container(
                        color: Colors.black.withValues(alpha: isViewed ? 0.3 : 0),
                        child: !isViewed && !isOwner
                          ? const Icon(LucideIcons.lock, color: Colors.white, size: 20)
                          : null,
                      ),
                    ),
                  ),
                ),
              ),
              if (isOwner)
                Positioned(
                  top: -5, right: -5,
                  child: GestureDetector(
                    onTap: () => _confirmDelete(item['_id']),
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.background, width: 2),
                      ),
                      child: const Icon(LucideIcons.trash2, size: 12, color: Colors.white),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            (item['user']?['fullName'] as String?)?.split(' ')[0] ?? 'مستخدم',
            style: TextStyle(
              color: isViewed ? Colors.white38 : Colors.white, 
              fontSize: 12, 
              fontWeight: FontWeight.bold
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  void _pickAndUpload() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.camera, imageQuality: 70);
    if (image == null) return;

    setState(() => _isUploading = true);
    try {
      final repo = ref.read(vibesRepositoryProvider);
      final bytes = await image.readAsBytes();
      final url = await repo.uploadImage(bytes, image.name);
      await repo.createInstant(url);
      ref.invalidate(instantsProvider);
      ToastService.showSuccess(context, 'تمت إضافة اللقطة! ✨');
    } catch (_) {
      ToastService.showError(context, 'فشل في رفع اللقطة');
    }
    setState(() => _isUploading = false);
  }

  void _viewInstant(dynamic item) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => InstantFullScreenView(item: item),
      ),
    ).then((_) => ref.invalidate(instantsProvider));
  }

  void _confirmDelete(String id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('حذف اللقطة؟', textAlign: TextAlign.right, style: TextStyle(color: Colors.white)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('إلغاء')),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              await ref.read(vibesRepositoryProvider).deleteInstant(id);
              ref.invalidate(instantsProvider);
              ToastService.showSuccess(context, 'تم الحذف بنجاح');
            },
            child: const Text('حذف', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}

class InstantFullScreenView extends ConsumerStatefulWidget {
  final dynamic item;
  const InstantFullScreenView({super.key, required this.item});

  @override
  ConsumerState<InstantFullScreenView> createState() => _InstantFullScreenViewState();
}

class _InstantFullScreenViewState extends ConsumerState<InstantFullScreenView> {
  double _progress = 0.0;
  Timer? _timer;
  late dynamic _currentItem;

  @override
  void initState() {
    super.initState();
    _currentItem = widget.item;
    ref.read(vibesRepositoryProvider).viewInstant(_currentItem['_id']);
    _startTimer();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(milliseconds: 50), (timer) {
      if (!mounted) return;
      setState(() {
        _progress += 0.01;
        if (_progress >= 1.0) {
          _timer?.cancel();
          Navigator.pop(context);
        }
      });
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final bool isLiked = (_currentItem['likes'] as List?)?.contains(user?.id) ?? false;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          Positioned.fill(
            child: CachedNetworkImage(
              imageUrl: _currentItem['mediaUrl'],
              fit: BoxFit.contain,
              placeholder: (context, url) => const Center(child: CircularProgressIndicator()),
            ),
          ),
          // Progress bar
          Positioned(
            top: 50, left: 16, right: 16,
            child: LinearProgressIndicator(
              value: _progress,
              backgroundColor: Colors.white24,
              valueColor: const AlwaysStoppedAnimation(Colors.white),
              minHeight: 3,
            ),
          ),
          // Header info
          Positioned(
            top: 70, left: 16, right: 16,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundImage: CachedNetworkImageProvider(
                        _currentItem['user']?['avatarUrl'] ?? 'https://ui-avatars.com/api/?name=U',
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      _currentItem['user']?['fullName'] ?? 'مستخدم',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(LucideIcons.x, color: Colors.white),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          // Bottom Actions
          Positioned(
            bottom: 50, left: 0, right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                GestureDetector(
                  onTap: _handleLike,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.black45,
                      borderRadius: BorderRadius.circular(30),
                      border: Border.all(color: isLiked ? Colors.red : Colors.white24),
                    ),
                    child: Row(
                      children: [
                        Icon(LucideIcons.heart, color: isLiked ? Colors.red : Colors.white, fill: isLiked ? 1.0 : 0.0),
                        const SizedBox(width: 8),
                        Text(
                          '${(_currentItem['likes'] as List?)?.length ?? 0}',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _handleLike() async {
    try {
      await ref.read(vibesRepositoryProvider).likeInstant(_currentItem['_id']);
      // We don't have an easy way to refresh just this item without a complex state, 
      // but we can at least update local count for visual feedback
      setState(() {
        final user = ref.read(currentUserProvider);
        final likes = List.from(_currentItem['likes'] ?? []);
        if (likes.contains(user?.id)) {
          likes.remove(user?.id);
        } else {
          likes.add(user?.id);
        }
        _currentItem = {..._currentItem, 'likes': likes};
      });
    } catch (_) {}
  }
}
