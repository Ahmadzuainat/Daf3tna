import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/core/services/socket_service.dart';
import 'package:daf3tna/features/games/data/game_repository.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart'; // To get current user

class TicTacToeView extends ConsumerStatefulWidget {
  const TicTacToeView({super.key});

  @override
  ConsumerState<TicTacToeView> createState() => _TicTacToeViewState();
}

class _TicTacToeViewState extends ConsumerState<TicTacToeView> {
  String? mode; 
  Map<String, dynamic>? gameData;
  String? roomCode;
  final TextEditingController _codeController = TextEditingController();
  bool loading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _listenToSocket();
    });
  }

  void _listenToSocket() {
    final socket = ref.read(socketServiceProvider).socket;
    
    socket.on('game:init', (data) {
      if (mounted) setState(() => gameData = data);
    });

    socket.on('game:updated', (data) {
      if (mounted) setState(() => gameData = data);
    });

    socket.on('game:error', (data) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(data['message'])));
    });
  }

  Future<void> _createRoom() async {
    setState(() => loading = true);
    try {
      final res = await ref.read(gameRepositoryProvider).createGame('tictactoe');
      setState(() {
        gameData = res.data;
        roomCode = res.data['roomCode'];
      });
      ref.read(socketServiceProvider).joinGame(roomCode!);
    } catch (e) {
       ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('فشل إنشاء الغرفة')));
    } finally {
      setState(() => loading = false);
    }
  }

  Future<void> _joinRoom() async {
    if (_codeController.text.isEmpty) return;
    setState(() => loading = true);
    try {
      final res = await ref.read(gameRepositoryProvider).joinGame(_codeController.text.toUpperCase());
      setState(() {
        gameData = res.data;
        roomCode = res.data['roomCode'];
      });
      ref.read(socketServiceProvider).joinGame(roomCode!);
    } catch (e) {
       ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('الغرفة غير موجودة')));
    } finally {
      setState(() => loading = false);
    }
  }

  void _makeMove(int index) {
    if (gameData?['status'] != 'playing') return;
    ref.read(socketServiceProvider).makeMove(roomCode!, {'index': index});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowRight, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text('Tic Tac Toe', style: TextStyle(color: Colors.white)),
        centerTitle: true,
      ),
      body: mode == null ? _buildModeSelection() : (mode == 'friend' && gameData == null ? _buildFriendSetup() : _buildGameBoard()),
    );
  }

  Widget _buildModeSelection() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _modeButton('ضد الكمبيوتر', 'AI Mode', LucideIcons.monitor, Colors.blue, () => setState(() => mode = 'ai')),
          const SizedBox(height: 20),
          _modeButton('ضد صديق', 'Multiplayer', LucideIcons.users, Colors.purple, () => setState(() => mode = 'friend')),
        ],
      ),
    );
  }

  Widget _modeButton(String t, String s, IconData i, Color c, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.white.withOpacity(0.1))),
        child: Row(children: [
          Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: c, borderRadius: BorderRadius.circular(12)), child: Icon(i, color: Colors.white)),
          const SizedBox(width: 20),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(t, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
            Text(s, style: TextStyle(color: Colors.white.withOpacity(0.5))),
          ])
        ]),
      ),
    );
  }

  Widget _buildFriendSetup() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(onPressed: loading ? null : _createRoom, child: const Text('أنشئ غرفة جديدة')),
            const SizedBox(height: 30),
            const Text('أو ادخل رمز الغرفة', style: TextStyle(color: Colors.white70)),
            const SizedBox(height: 15),
            TextField(
              controller: _codeController,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
              decoration: const InputDecoration(hintText: 'CODE', hintStyle: TextStyle(color: Colors.white24)),
            ),
            const SizedBox(height: 15),
            ElevatedButton(onPressed: loading ? null : _joinRoom, child: const Text('دخول')),
          ],
        ),
      ),
    );
  }

  Widget _buildGameBoard() {
    if (gameData?['status'] == 'waiting') {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('بانتظار الصديق...', style: TextStyle(color: Colors.white, fontSize: 20)),
            const SizedBox(height: 20),
            Text(roomCode ?? '', style: const TextStyle(color: Colors.blue, fontSize: 48, fontWeight: FontWeight.bold, letterSpacing: 5)),
          ],
        ),
      );
    }

    final board = List<String?>.from(gameData?['gameState']?['board'] ?? List.filled(9, null));
    return Column(
      children: [
        const SizedBox(height: 30),
        _buildTurnIndicator(),
        const SizedBox(height: 30),
        _buildGrid(board),
        if (gameData?['status'] == 'finished') _buildWinnerSection(),
      ],
    );
  }

  Widget _buildTurnIndicator() {
    return const Text('الدور الحالي', style: TextStyle(color: Colors.white70));
  }

  Widget _buildGrid(List<String?> board) {
    return Container(
      width: 350, height: 350,
      padding: const EdgeInsets.all(16),
      child: GridView.builder(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, crossAxisSpacing: 10, mainAxisSpacing: 10),
        itemCount: 9,
        itemBuilder: (c, i) => GestureDetector(
          onTap: () => _makeMove(i),
          child: Container(
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
            child: Center(child: board[i] == null ? null : (board[i] == 'X' ? const Icon(LucideIcons.x, color: Colors.blue, size: 40) : const Icon(LucideIcons.circle, color: Colors.red, size: 35))),
          ),
        ),
      ),
    );
  }

  Widget _buildWinnerSection() {
    return const Text('انتهت اللعبة!', style: TextStyle(color: Colors.amber, fontSize: 24, fontWeight: FontWeight.bold));
  }
}
