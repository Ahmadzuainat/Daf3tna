import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter_riverpod/flutter_riverpod.dart';

class SocketService {
  late IO.Socket _socket;
  
  IO.Socket get socket => _socket;

  void init(String userId, String batchId) {
    // Optimization: Use the same host as the API, ensuring mobile reachability
    const baseUrl = 'http://192.168.1.49:5003'; // Matches api_client.dart
    _socket = IO.io(baseUrl, IO.OptionBuilder()
      .setTransports(['websocket'])
      .disableAutoConnect()
      .build());

    _socket.connect();

    _socket.onConnect((_) {
      print('✅ Connected to Socket Server');
      _socket.emit('setup', {'_id': userId, 'batchId': batchId});
    });

    _socket.onDisconnect((_) => print('❌ Disconnected from Socket Server'));
  }

  void joinGame(String roomCode) {
    _socket.emit('game:joinRoom', {'roomCode': roomCode});
  }

  void makeMove(String roomCode, dynamic move) {
    _socket.emit('game:move', {'roomCode': roomCode, 'move': move});
  }

  void leaveGame(String roomCode) {
    _socket.emit('game:leave', {'roomCode': roomCode});
  }

  void dispose() {
    _socket.disconnect();
  }
}

final socketServiceProvider = Provider((ref) => SocketService());
