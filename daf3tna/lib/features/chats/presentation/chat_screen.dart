import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/chats/data/chat_repository.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart';
import 'package:daf3tna/models/chat_model.dart';
import 'package:daf3tna/models/user_model.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart' as intl;
import 'dart:developer' as dev;
import 'package:daf3tna/core/network/socket_service.dart';
import 'package:daf3tna/core/utils/toast_service.dart';

final chatMessagesProvider = StateProvider.family<List<MessageModel>, String>((ref, chatId) => []);

class ChatScreen extends ConsumerStatefulWidget {
  final ChatModel chat;
  final UserModel otherUser;

  const ChatScreen({super.key, required this.chat, required this.otherUser});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  bool _isOtherTyping = false;
  DateTime? _lastTypingTime;

  @override
  void initState() {
    super.initState();
    _loadMessages();
    _setupSocket();
  }

  void _setupSocket() {
    final socketService = ref.read(socketServiceProvider);
    socketService.connect();
    
    // Join private room (chatId)
    socketService.joinDM(widget.chat.id); 

    socketService.onDMReceived((data) {
      if (!mounted) return;
      
      // Check if message belongs to THIS chat
      if (data['chatId'] == widget.chat.id) {
        final newMessage = MessageModel.fromJson(data);
        final notifier = ref.read(chatMessagesProvider(widget.chat.id).notifier);
        
        // Avoid duplicates (from optimistic updates)
        if (!notifier.state.any((m) => m.id == newMessage.id)) {
          notifier.update((state) => [...state, newMessage]);
          _scrollToBottom();
          _markAsRead();
        }
      }
    });

    socketService.onDMTypingUpdate((data) {
      if (!mounted) return;
      if (data['chatId'] == widget.chat.id) {
        setState(() {
          _isOtherTyping = data['isTyping'] ?? false;
        });
        _scrollToBottom();
      }
    });
  }

  void _onTypingChanged(String text) {
    if (text.isEmpty) {
      ref.read(socketServiceProvider).emitDMTyping(widget.chat.id, widget.otherUser.id, false);
      _lastTypingTime = null;
      return;
    }

    final now = DateTime.now();
    if (_lastTypingTime == null || now.difference(_lastTypingTime!).inSeconds > 2) {
      _lastTypingTime = now;
      ref.read(socketServiceProvider).emitDMTyping(widget.chat.id, widget.otherUser.id, true);
      
      Future.delayed(const Duration(seconds: 3), () {
        if (mounted && _lastTypingTime != null && DateTime.now().difference(_lastTypingTime!).inSeconds >= 3) {
          ref.read(socketServiceProvider).emitDMTyping(widget.chat.id, widget.otherUser.id, false);
          _lastTypingTime = null;
        }
      });
    }
  }

  void _markAsRead() {
    ref.read(chatRepositoryProvider).markAsRead(widget.chat.id);
  }

  void _loadMessages() async {
    try {
      final messages = await ref.read(chatRepositoryProvider).fetchMessages(widget.chat.id);
      ref.read(chatMessagesProvider(widget.chat.id).notifier).state = messages;
      _scrollToBottom();
      _markAsRead();
    } catch (e) {
      dev.log('Error loading messages: $e');
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _handleSend() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    _messageController.clear();
    
    try {
      // We send via HTTP and receive back via Socket for consistency, 
      // or send and add optimistically.
      final sentMessage = await ref.read(chatRepositoryProvider).sendMessage(widget.chat.id, text);
      
      // Update local state optimistically
      final notifier = ref.read(chatMessagesProvider(widget.chat.id).notifier);
      if (!notifier.state.any((m) => m.id == sentMessage.id)) {
        notifier.update((state) => [...state, sentMessage]);
        _scrollToBottom();
      }

      // 2. Broadcast via Socket (web parity)
      ref.read(socketServiceProvider).emitDMMessage({
        ...sentMessage.toJson(),
        'chatId': widget.chat.id,
        'receiver': widget.otherUser.id,
      });
    } catch (e) {
      if (mounted) ToastService.showError(context, 'فشل إرسال الرسالة');
    }
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(chatMessagesProvider(widget.chat.id));
    final currentUser = ref.watch(currentUserProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundImage: CachedNetworkImageProvider(widget.otherUser.avatarUrl ?? ''),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.otherUser.fullName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  if (widget.otherUser.isOnline)
                    const Text('نشط الآن', style: TextStyle(fontSize: 10, color: AppColors.success)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(LucideIcons.phone), onPressed: () {}),
          IconButton(icon: const Icon(LucideIcons.video), onPressed: () {}),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: messages.length + (_isOtherTyping ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == messages.length && _isOtherTyping) {
                  return _buildTypingIndicator();
                }
                final msg = messages[index];
                final isMe = msg.sender == currentUser?.id;
                return _buildMessageItem(msg, isMe);
              },
            ),
          ),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.surface.withOpacity(0.5),
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(16),
            topRight: Radius.circular(16),
            bottomLeft: Radius.zero,
            bottomRight: Radius.circular(16),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('جاري الكتابة', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
            const SizedBox(width: 8),
            SizedBox(
              width: 12,
              height: 12,
              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary.withOpacity(0.5)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageItem(MessageModel msg, bool isMe) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isMe ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: isMe ? const Radius.circular(16) : Radius.zero,
            bottomRight: isMe ? Radius.zero : const Radius.circular(16),
          ),
        ),
        child: Column(
          crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(
              msg.content,
              style: const TextStyle(color: Colors.white, fontSize: 14),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  intl.DateFormat('HH:mm').format(msg.createdAt),
                  style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 9),
                ),
                if (isMe) ...[
                  const SizedBox(width: 4),
                  Icon(
                    msg.isRead ? LucideIcons.checkCheck : LucideIcons.check,
                    size: 10,
                    color: msg.isRead ? AppColors.success : Colors.white.withOpacity(0.5),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(context).padding.bottom + 16),
      decoration: BoxDecoration(
        color: AppColors.background,
        border: Border(top: BorderSide(color: Colors.white.withOpacity(0.05))),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: () {},
            icon: const Icon(LucideIcons.plusCircle, color: AppColors.primary),
          ),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(24),
              ),
              child: TextField(
                controller: _messageController,
                onChanged: _onTypingChanged,
                textAlign: TextAlign.right,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  hintText: 'اكتب رسالة...',
                  hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 14),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            onPressed: _handleSend,
            icon: const Icon(LucideIcons.send, color: AppColors.primary),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}
