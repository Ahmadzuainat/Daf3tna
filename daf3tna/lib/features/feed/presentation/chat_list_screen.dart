import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/feed/data/social_repository.dart';
import 'package:daf3tna/models/social_models.dart' hide ChatModel;
import 'package:cached_network_image/cached_network_image.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'package:daf3tna/features/chats/presentation/chat_screen.dart';
import 'package:daf3tna/models/chat_model.dart';
import 'package:daf3tna/features/chats/data/chat_repository.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart';
import 'package:daf3tna/core/network/socket_service.dart';
import 'package:daf3tna/core/utils/toast_service.dart';

final chatsProvider = StateNotifierProvider<ChatsNotifier, AsyncValue<List<ChatModel>>>((ref) {
  return ChatsNotifier(ref);
});

class ChatsNotifier extends StateNotifier<AsyncValue<List<ChatModel>>> {
  final Ref _ref;
  ChatsNotifier(this._ref) : super(const AsyncValue.loading()) {
    _loadChats();
    _listenToSockets();
  }

  Future<void> _loadChats() async {
    try {
      final data = await _ref.read(chatRepositoryProvider).fetchChats();
      state = AsyncValue.data(data);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  void _listenToSockets() {
    final socket = _ref.read(socketServiceProvider);
    
    // Listen for new messages to update the list preview
    socket.onNewMessage((data) {
      state.whenData((chats) {
        final chatId = data['chatId'];
        final newMessage = MessageModel.fromJson(data);
        
        final updatedChats = chats.map((chat) {
          if (chat.id == chatId) {
            final newUnreadCount = Map<String, int>.from(chat.unreadCount);
            final currentUserId = _ref.read(currentUserProvider)?.id;
            if (currentUserId != null) {
              newUnreadCount[currentUserId] = (newUnreadCount[currentUserId] ?? 0) + 1;
            }

            return chat.copyWith(
              lastMessage: newMessage,
              updatedAt: DateTime.now(),
              unreadCount: newUnreadCount,
            );
          }
          return chat;
        }).toList();
        
        // Sort by most recent
        updatedChats.sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
        state = AsyncValue.data(updatedChats);
      });
    });
  }

  Future<void> refresh() => _loadChats();
}

class ChatListScreen extends ConsumerWidget {
  const ChatListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chatsAsync = ref.watch(chatsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        title: const Text('الرسائل', style: TextStyle(fontWeight: FontWeight.bold)),
        centerTitle: true,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.read(chatsProvider.notifier).refresh(),
        child: chatsAsync.when(
          data: (chats) {
            if (chats.isEmpty) {
              return const Center(child: Text('لا توجد محادثات حالياً', style: TextStyle(color: AppColors.textDim)));
            }
            return ListView.builder(
              itemCount: chats.length,
              itemBuilder: (context, index) => _buildChatItem(context, ref, chats[index]),
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(child: Text('حدث خطأ في جلب المحادثات')),
        ),
      ),
    );
  }

  Widget _buildChatItem(BuildContext context, WidgetRef ref, ChatModel chat) {
    final currentUser = ref.read(currentUserProvider);
    final otherUser = chat.participants.firstWhere(
      (p) => p.id != currentUser?.id,
      orElse: () => chat.participants.first,
    );

    return ListTile(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ChatScreen(chat: chat, otherUser: otherUser),
          ),
        );
      },
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      leading: Stack(
        children: [
          CircleAvatar(
            radius: 28,
            backgroundImage: CachedNetworkImageProvider(otherUser.avatarUrl ?? 'https://via.placeholder.com/150'),
          ),
          if (otherUser.isOnline)
            Positioned(
              right: 0,
              bottom: 0,
              child: Container(
                width: 14,
                height: 14,
                decoration: BoxDecoration(
                  color: AppColors.success,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.background, width: 2),
                ),
              ),
            ),
        ],
      ),
      title: Text(
        otherUser.fullName,
        textAlign: TextAlign.right,
        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
      ),
      subtitle: Text(
        chat.lastMessage?.content ?? 'ابدأ المحادثة الآن',
        textAlign: TextAlign.right,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(color: AppColors.textDim, fontSize: 13),
      ),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            timeago.format(chat.updatedAt, locale: 'ar', allowFromNow: true),
            style: const TextStyle(color: AppColors.textMuted, fontSize: 10),
          ),
          const SizedBox(height: 4),
          // Unread count placeholder
        ],
      ),
    );
  }
}
