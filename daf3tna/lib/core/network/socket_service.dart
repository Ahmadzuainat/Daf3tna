import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:daf3tna/core/storage/secure_storage_service.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart';
import 'package:daf3tna/core/utils/toast_service.dart';
import 'package:flutter/material.dart';

final socketServiceProvider = Provider<SocketService>((ref) {
  return SocketService(ref);
});

class SocketService {
  final Ref _ref;
  io.Socket? _socket;
  
  SocketService(this._ref);

  Future<void> connect() async {
    if (_socket != null) return;

    final token = await _ref.read(secureStorageServiceProvider).getToken();
    final user = _ref.read(currentUserProvider);
    
    _socket = io.io('https://daf3tna.onrender.com', io.OptionBuilder()
      .setTransports(['websocket'])
      .setAuth({'token': token})
      .enableAutoConnect()
      .build());

    _socket!.onConnect((_) {
      print('Socket connected: ${_socket!.id}');
      if (user != null) {
        _socket!.emit('setup', user.toJson());
      }
    });

    _socket!.onDisconnect((_) => print('Socket disconnected'));
    _socket!.onConnectError((err) => print('Socket connect error: $err'));

    // Global Listeners
    _socket!.on('force:logout', (data) async {
      final reason = data['reason'] ?? 'تم تسجيل خروجك من قبل المسؤول';
      await _ref.read(authRepositoryProvider).logout();
      _ref.read(currentUserProvider.notifier).state = null;
      ToastService.showError(reason);
    });

    _socket!.on('global:alert', (data) {
      final message = data['message'] ?? '';
      ToastService.showInfo(message);
    });
  }

  void joinHub(String hubId, String channelId) async {
    if (_socket == null) await connect();
    
    final action = () {
      _socket?.emit('hub:join', {'hubId': hubId, 'channelId': channelId});
    };

    if (_socket!.connected) {
      action();
    } else {
      _socket!.once('connect', (_) => action());
    }
  }

  void leaveHub(String hubId, String channelId) {
    _socket?.emit('hub:leave', {'hubId': hubId, 'channelId': channelId});
  }

  void emitHubMessage(Map<String, dynamic> message) {
    _socket?.emit('hub:newMessage', message);
  }

  void emitTyping(String hubId, String channelId, bool isTyping) {
    final user = _ref.read(currentUserProvider);
    if (user != null) {
      _socket?.emit('hub:typing', {
        'hubId': hubId,
        'channelId': channelId,
        'user': user.toJson(),
        'isTyping': isTyping
      });
    }
  }

  void joinDM(String chatId) async {
    if (_socket == null) await connect();
    if (_socket!.connected) {
      _socket?.emit('dm:join', chatId);
    } else {
      _socket!.once('connect', (_) => _socket?.emit('dm:join', chatId));
    }
  }

  void emitDMMessage(Map<String, dynamic> message) {
    _socket?.emit('dm:newMessage', message);
  }

  void onDMReceived(Function(dynamic) callback) {
    _socket?.on('dm:messageReceived', callback);
  }

  void onNewMessage(Function(dynamic) callback) {
    _socket?.on('hub:messageReceived', callback);
  }

  void onTypingUpdate(Function(dynamic) callback) {
    _socket?.on('hub:typingUpdate', callback);
  }

  void onNotification(Function(dynamic) callback) {
    _socket?.on('notification:received', callback);
  }

  void onPanicAlert(Function(dynamic) callback) {
    _socket?.on('panic_alert', callback);
  }

  void offChatEvents() {
    _socket?.off('hub:messageReceived');
    _socket?.off('hub:typingUpdate');
    _socket?.off('dm:messageReceived');
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  bool get isConnected => _socket?.connected ?? false;
}
