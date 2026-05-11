import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/hubs/data/hub_repository.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart';
import 'package:daf3tna/models/hub_model.dart';
import 'package:glassmorphism/glassmorphism.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:daf3tna/features/hubs/presentation/hub_chat_screen.dart';
import 'package:daf3tna/core/widgets/shimmer_loading.dart';
import 'package:daf3tna/core/utils/toast_service.dart';

final hubsProvider = FutureProvider<List<HubModel>>((ref) {
  return ref.read(hubRepositoryProvider).fetchHubs();
});

class HubsScreen extends ConsumerStatefulWidget {
  const HubsScreen({super.key});

  @override
  ConsumerState<HubsScreen> createState() => _HubsScreenState();
}

class _HubsScreenState extends ConsumerState<HubsScreen> {
  bool _isJoining = false;

  void _handleHubAction(HubModel hub) async {
    final currentUser = ref.read(currentUserProvider);
    // Defensive check: ensure both are strings and trimmed
    final isMember = hub.members.any((m) => m.toString() == currentUser?.id.toString());

    if (!isMember) {
      _showJoinDialog(hub);
      return;
    }

    if (hub.textChannels.isEmpty) {
      ToastService.showError(context, 'هذا المجتمع لا يحتوي على غرف محادثة حالياً');
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => HubChatScreen(hub: hub, channel: hub.textChannels.first),
      ),
    );
  }

  void _showJoinDialog(HubModel hub) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: Text(hub.name, textAlign: TextAlign.right, style: const TextStyle(color: Colors.white)),
        content: const Text(
          'أنت غير منضم لهذا المجتمع حالياً. هل ترغب في الانضمام للمشاركة في المحادثات؟',
          textAlign: TextAlign.right,
          style: TextStyle(color: AppColors.textDim),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إلغاء', style: TextStyle(color: AppColors.textDim)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
            onPressed: () {
              Navigator.pop(context);
              _joinHub(hub);
            },
            child: const Text('انضمام الآن', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }


  Future<void> _joinHub(HubModel hub) async {
    setState(() => _isJoining = true);
    try {
      await ref.read(hubRepositoryProvider).joinHub(hub.id);
      ref.refresh(hubsProvider);
      if (mounted) ToastService.showSuccess(context, 'تم الانضمام للمجتمع بنجاح ✅');
    } catch (e) {
      if (mounted) ToastService.showError(context, 'فشل الانضمام للمجتمع ❌');
    } finally {
      if (mounted) setState(() => _isJoining = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hubsAsync = ref.watch(hubsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(hubsProvider),
        color: AppColors.primary,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverAppBar(
              expandedHeight: 120.0,
              floating: false,
              pinned: true,
              backgroundColor: AppColors.background,
              flexibleSpace: FlexibleSpaceBar(
                title: const Text('اكتشف المجتمعات', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                centerTitle: true,
                background: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [AppColors.primary.withValues(alpha: 0.1), Colors.transparent],
                    ),
                  ),
                ),
              ),
            ),
            hubsAsync.when(
              data: (hubs) {
                if (hubs.isEmpty) {
                  return SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(LucideIcons.flame, size: 64, color: Colors.white.withOpacity(0.05)),
                          const SizedBox(height: 16),
                          const Text(
                            'لا يوجد مجتمعات مضافة لدفعتك حالياً',
                            style: TextStyle(color: AppColors.textDim, fontSize: 16),
                          ),
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: () => ref.refresh(hubsProvider),
                            child: const Text('تحديث القائمة'),
                          ),
                        ],
                      ),
                    ),
                  );
                }
                return SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  sliver: SliverGrid(
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: MediaQuery.of(context).size.width > 600 ? 3 : 2,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: 0.9,
                    ),
                    delegate: SliverChildBuilderDelegate(
                      (context, index) => _HubCard(
                        hub: hubs[index],
                        index: index,
                        onTap: () => _handleHubAction(hubs[index]),
                      ),
                      childCount: hubs.length,
                    ),
                  ),
                );
              },
              loading: () => SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverGrid(
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: MediaQuery.of(context).size.width > 600 ? 3 : 2,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 0.9,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => const ShimmerLoading.rectangular(height: 150),
                    childCount: 6,
                  ),
                ),
              ),
              error: (err, stack) => SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(LucideIcons.alertCircle, color: AppColors.error, size: 40),
                      const SizedBox(height: 16),
                      Text('خطأ: $err', style: const TextStyle(color: AppColors.textDim)),
                      TextButton(
                        onPressed: () => ref.refresh(hubsProvider),
                        child: const Text('إعادة المحاولة'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HubCard extends ConsumerWidget {
  final HubModel hub;
  final int index;
  final VoidCallback onTap;

  const _HubCard({
    required this.hub,
    required this.index,
    required this.onTap,
  });

  static final List<LinearGradient> _gradients = [
    const LinearGradient(colors: [Color(0xFFEF4444), Color(0xFFF97316)], begin: Alignment.topLeft, end: Alignment.bottomRight),
    const LinearGradient(colors: [Color(0xFFF59E0B), Color(0xFFFCD34D)], begin: Alignment.topLeft, end: Alignment.bottomRight),
    const LinearGradient(colors: [Color(0xFF3B82F6), Color(0xFF8B5CF6)], begin: Alignment.topLeft, end: Alignment.bottomRight),
    const LinearGradient(colors: [Color(0xFF8B5CF6), Color(0xFFD946EF)], begin: Alignment.topLeft, end: Alignment.bottomRight),
    const LinearGradient(colors: [Color(0xFF10B981), Color(0xFF34D399)], begin: Alignment.topLeft, end: Alignment.bottomRight),
    const LinearGradient(colors: [Color(0xFFEC4899), Color(0xFFF43F5E)], begin: Alignment.topLeft, end: Alignment.bottomRight),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final currentUser = ref.watch(currentUserProvider);
    // Robust check: ensure both IDs are compared as strings to avoid type mismatches
    final isJoined = hub.members.any((m) => m.toString() == currentUser?.id.toString());
    
    final gradient = hub.color.startsWith('#') 
      ? LinearGradient(colors: [_parseColor(hub.color), _parseColor(hub.color).withValues(alpha: 0.7)])
      : _gradients[index % _gradients.length];

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: gradient.colors.first.withOpacity(0.2),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Stack(
          children: [
            Positioned(
              left: -8,
              top: -8,
              child: Opacity(
                opacity: 0.15,
                child: Icon(_getHubIcon(hub.icon), size: 70, color: Colors.white),
              ),
            ),
            
            Padding(
              padding: const EdgeInsets.all(14.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      if (isJoined)
                        Container(
                          padding: const EdgeInsets.all(3),
                          decoration: const BoxDecoration(color: Colors.white24, shape: BoxShape.circle),
                          child: const Icon(LucideIcons.check, size: 12, color: Colors.white),
                        )
                      else
                        const Icon(LucideIcons.plusCircle, size: 16, color: Colors.white70),
                      
                      Icon(_getHubIcon(hub.icon), color: Colors.white, size: 20),
                    ],
                  ),
                  const Spacer(),
                  Text(
                    hub.name,
                    textAlign: TextAlign.right,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text(
                        '${hub.members.length} عضو',
                        style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 10),
                      ),
                      const SizedBox(width: 4),
                      Icon(LucideIcons.users, size: 10, color: Colors.white.withOpacity(0.8)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: (index * 40).ms).scale(begin: const Offset(0.95, 0.95));
  }

  Color _parseColor(String colorStr) {
    try {
      if (colorStr.startsWith('#')) {
        return Color(int.parse(colorStr.replaceAll('#', '0xFF')));
      }
      return AppColors.primary;
    } catch (_) {
      return AppColors.primary;
    }
  }

  IconData _getHubIcon(String iconName) {
    switch (iconName.toLowerCase()) {
      case 'code': return LucideIcons.code;
      case 'game': return LucideIcons.gamepad2;
      case 'book': return LucideIcons.bookOpen;
      case 'music': return LucideIcons.music;
      case 'heart': return LucideIcons.heart;
      case 'zap': return LucideIcons.zap;
      default: return LucideIcons.hash;
    }
  }
}
