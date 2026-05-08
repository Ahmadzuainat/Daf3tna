import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/feed/data/social_repository.dart';
import 'package:daf3tna/models/social_models.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:daf3tna/core/network/socket_service.dart';
import 'package:daf3tna/core/utils/toast_service.dart';

final notificationsProvider = StateNotifierProvider<NotificationsNotifier, AsyncValue<List<NotificationModel>>>((ref) {
  return NotificationsNotifier(ref);
});

class NotificationsNotifier extends StateNotifier<AsyncValue<List<NotificationModel>>> {
  final Ref _ref;
  NotificationsNotifier(this._ref) : super(const AsyncValue.loading()) {
    _loadNotifications();
    _listenToSockets();
  }

  Future<void> _loadNotifications() async {
    try {
      final data = await _ref.read(socialRepositoryProvider).fetchNotifications();
      state = AsyncValue.data(data);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  void _listenToSockets() {
    _ref.read(socketServiceProvider).onNotification((data) {
      final newNotif = NotificationModel.fromJson(data);
      state.whenData((current) {
        state = AsyncValue.data([newNotif, ...current]);
      });
    });
  }

  Future<void> refresh() => _loadNotifications();
}

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        title: const Text('التنبيهات', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.checkCheck, color: AppColors.primary),
            onPressed: () async {
              await ref.read(socialRepositoryProvider).markNotificationsRead();
              ref.read(notificationsProvider.notifier).refresh();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.read(notificationsProvider.notifier).refresh(),
        child: notificationsAsync.when(
          data: (notifications) {
            if (notifications.isEmpty) {
              return const Center(child: Text('لا توجد تنبيهات جديدة', style: TextStyle(color: AppColors.textDim)));
            }
            return ListView.builder(
              itemCount: notifications.length,
              itemBuilder: (context, index) => _buildNotificationItem(notifications[index]),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(child: Text('Error: $err')),
        ),
      ),
    );
  }

  Widget _buildNotificationItem(NotificationModel notification) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05))),
        color: notification.isRead ? Colors.transparent : AppColors.primary.withOpacity(0.05),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundImage: CachedNetworkImageProvider(notification.sender?.avatarUrl ?? 'https://via.placeholder.com/150'),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RichText(
                  text: TextSpan(
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                    children: [
                      TextSpan(
                        text: notification.sender?.fullName ?? 'نظام',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const TextSpan(text: ' '),
                      TextSpan(text: notification.content),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  timeago.format(notification.createdAt, locale: 'ar'),
                  style: const TextStyle(color: AppColors.textDim, fontSize: 11),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
