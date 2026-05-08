import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:daf3tna/core/storage/secure_storage_service.dart';

final socketServiceProvider = Provider<SocketService>((ref) {
  return SocketService(ref);
});

class SocketService {
  final Ref _ref;
  io.Socket? _socket;

  SocketService(this._ref);

  void connect(Map<String, dynamic> userData) {
    if (_socket != null && _socket!.connected) return;

    _socket = io.io('http://192.168.1.49:5003', io.OptionBuilder()
      .setTransports(['websocket'])
      .disableAutoConnect()
      .build());

    _socket!.connect();

    _socket!.onConnect((_) {
      print('✅ Socket Connected');
      _socket!.emit('setup', userData);
    });

    _socket!.onDisconnect((_) => print('❌ Socket Disconnected'));
    _socket!.onConnectError((err) => print('⚠️ Socket Connection Error: $err'));
  }

  void on(String event, Function(dynamic) callback) {
    _socket?.on(event, callback);
  }

  void emit(String event, dynamic data) {
    _socket?.emit(event, data);
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  bool get isConnected => _socket?.connected ?? false;
}
