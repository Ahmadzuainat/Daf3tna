import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/hubs/data/hub_repository.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart';
import 'package:daf3tna/core/network/socket_service.dart';
import 'package:daf3tna/models/hub_model.dart';
import 'package:daf3tna/models/user_model.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart' as intl;

final hubMessagesProvider = StateProvider.family<List<HubMessageModel>, String>((ref, channelId) => []);

class HubChatScreen extends ConsumerStatefulWidget {
  final HubModel hub;
  final HubChannel channel;

  const HubChatScreen({super.key, required this.hub, required this.channel});

  @override
  ConsumerState<HubChatScreen> createState() => _HubChatScreenState();
}

class _HubChatScreenState extends ConsumerState<HubChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  HubChannel? _activeChannel;
  UserModel? _typingUser;

  @override
  void initState() {
    super.initState();
    _activeChannel = widget.channel;
    _loadMessages();
    _setupSocket();
  }

  void _loadMessages() async {
    if (_activeChannel == null) return;
    // Use channel name for API and Socket consistency with web
    final messages = await ref.read(hubRepositoryProvider).fetchMessages(widget.hub.id, _activeChannel!.name);
    ref.read(hubMessagesProvider(_activeChannel!.name).notifier).state = messages;
    _scrollToBottom();
  }

  void _setupSocket() {
    final socket = ref.read(socketServiceProvider);
    socket.connect();
    
    // Ensure we join the hub room reliably using channel NAME (web parity)
    socket.joinHub(widget.hub.id, _activeChannel?.name ?? '');
    
    socket.onNewMessage((data) {
      print('📩 Received new hub message via socket: $data');
      if (data['channelId'] == _activeChannel?.name) {
        try {
          final newMessage = HubMessageModel.fromJson(data);
          final notifier = ref.read(hubMessagesProvider(_activeChannel!.name).notifier);
          
          // Avoid duplication if optimistic UI already added it
          if (!notifier.state.any((m) => m.id == newMessage.id)) {
            notifier.update((state) => [...state, newMessage]);
            _scrollToBottom();
          }
        } catch (e) {
          print('❌ Error parsing hub message: $e');
        }
      }
    });

    socket.onTypingUpdate((data) {
      if (data['channelId'] == _activeChannel?.id) {
        if (mounted) {
          setState(() {
            _typingUser = data['isTyping'] ? UserModel.fromJson(data['user']) : null;
          });
        }
      }
    });
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
    if (text.isEmpty || _activeChannel == null) return;

    final currentUser = ref.read(currentUserProvider);
    if (currentUser == null) return;

    _messageController.clear();
    
    try {
      final sentMessage = await ref.read(hubRepositoryProvider).sendMessage(
        hubId: widget.hub.id,
        channelId: _activeChannel!.name, // Use name
        text: text,
      );
      
      // Update local state immediately (Optimistic UI)
      final channelName = _activeChannel!.name;
      final notifier = ref.read(hubMessagesProvider(channelName).notifier);
      if (!notifier.state.any((m) => m.id == sentMessage.id)) {
        notifier.update((state) => [...state, sentMessage]);
        _scrollToBottom();
      }
      
      // Emit the message via socket so others in the room receive it (web parity)
      ref.read(socketServiceProvider).emitHubMessage({
        'hubId': widget.hub.id,
        'channelId': _activeChannel!.name,
        ...sentMessage.toJson(),
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('خطأ في الإرسال: $e')));
    }
  }

  void _onTextChanged(String value) {
    if (_activeChannel == null) return;
    ref.read(socketServiceProvider).emitTyping(widget.hub.id, _activeChannel!.name, value.isNotEmpty);
  }

  @override
  Widget build(BuildContext context) {
    final channelName = _activeChannel?.name ?? '';
    final messages = ref.watch(hubMessagesProvider(channelName));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(widget.hub.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('# $channelName', style: TextStyle(fontSize: 12, color: AppColors.primary.withValues(alpha: 0.7))),
          ],
        ),
        actions: [
          Builder(builder: (context) => IconButton(
            icon: const Icon(LucideIcons.menu),
            onPressed: () => Scaffold.of(context).openEndDrawer(),
          )),
        ],
      ),
      endDrawer: _buildDrawer(),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: messages.length,
              itemBuilder: (context, index) {
                final msg = messages[index];
                return _buildMessageItem(msg);
              },
            ),
          ),
          if (_typingUser != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text('${_typingUser!.fullName} يكتب الآن...', style: const TextStyle(color: AppColors.primary, fontSize: 12)),
                  const SizedBox(width: 8),
                  const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2)),
                ],
              ),
            ),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      backgroundColor: const Color(0xFF0F172A),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          DrawerHeader(
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.05)),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(widget.hub.name, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(widget.hub.category, style: const TextStyle(color: AppColors.textDim, fontSize: 14)),
              ],
            ),
          ),
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text('القنوات النصية', textAlign: TextAlign.right, style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.bold)),
          ),
          ...widget.hub.textChannels.map((ch) => ListTile(
            leading: Icon(LucideIcons.hash, color: _activeChannel?.id == ch.id ? AppColors.primary : AppColors.textMuted),
            title: Text(ch.name, textAlign: TextAlign.right, style: TextStyle(color: _activeChannel?.id == ch.id ? Colors.white : AppColors.textDim)),
            onTap: () {
              if (_activeChannel?.id != ch.id) {
                // Leave old room
                ref.read(socketServiceProvider).leaveHub(widget.hub.id, _activeChannel?.name ?? '');
                
                setState(() => _activeChannel = ch);
                _loadMessages();
                
                // Join new room
                ref.read(socketServiceProvider).joinHub(widget.hub.id, ch.name);
              }
              Navigator.pop(context);
            },
            selected: _activeChannel?.id == ch.id,
            selectedTileColor: Colors.white.withValues(alpha: 0.05),
          )),
        ],
      ),
    );
  }

  Widget _buildMessageItem(HubMessageModel msg) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 18,
            backgroundImage: CachedNetworkImageProvider(msg.sender.avatarUrl ?? ''),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(
                      intl.DateFormat('HH:mm').format(msg.createdAt),
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.3), fontSize: 10),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      msg.sender.fullName,
                      style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.05),
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(16),
                      bottomLeft: Radius.circular(16),
                      bottomRight: Radius.circular(16),
                    ),
                  ),
                  child: Text(
                    msg.text ?? '',
                    textAlign: TextAlign.right,
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(context).padding.bottom + 16),
      decoration: BoxDecoration(
        color: AppColors.background,
        border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.05))),
      ),
      child: Row(
        children: [
          Container(
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(12),
            ),
            child: IconButton(
              onPressed: _handleSend,
              icon: const Icon(LucideIcons.send, color: Colors.white),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.05),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
              ),
              child: TextField(
                controller: _messageController,
                textAlign: TextAlign.right,
                style: const TextStyle(color: Colors.white),
                onChanged: _onTextChanged,
                decoration: const InputDecoration(
                  hintText: 'اكتب رسالتك هنا...',
                  hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 14),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            onPressed: () {},
            icon: const Icon(LucideIcons.image, color: AppColors.textMuted),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    ref.read(socketServiceProvider).leaveHub(widget.hub.id, _activeChannel?.name ?? '');
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}
