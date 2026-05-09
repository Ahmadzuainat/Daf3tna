import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_chess_board/flutter_chess_board.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/core/services/socket_service.dart';
import 'package:daf3tna/features/games/data/game_repository.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart';

class ChessView extends ConsumerStatefulWidget {
  const ChessView({super.key});

  @override
  ConsumerState<ChessView> createState() => _ChessViewState();
}

class _ChessViewState extends ConsumerState<ChessView> {
  String? mode;
  Map<String, dynamic>? gameData;
  String? roomCode;
  final ChessBoardController _controller = ChessBoardController();
  final TextEditingController _codeController = TextEditingController();
  bool loading = false;
  String currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _listenToSocket();
    });
  }

  void _listenToSocket() {
    final socket = ref.read(socketServiceProvider).socket;

    socket.on('game:init', (data) => _updateGameState(data));
    socket.on('game:updated', (data) => _updateGameState(data));
    socket.on('game:error', (data) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(data['message'])));
      }
    });
  }

  void _updateGameState(Map<String, dynamic> data) {
    if (!mounted) return;
    setState(() {
      gameData = data;
      roomCode = data['roomCode'];
      
      final serverFen = data['gameState']?['fen'];
      if (serverFen != null && serverFen != 'start') {
        final currentUser = ref.read(authRepositoryProvider).currentUser;
        final turnData = data['currentTurn'];
        final turnId = (turnData is Map ? turnData['_id'] : turnData)?.toString();
        final isMyTurn = turnId == currentUser?.id;

        // Optimized sync: Only load FEN if it's NOT our turn OR if our board is totally out of sync
        // This prevents the "snap-back" effect during your own turn animations.
        if (_controller.getFen() != serverFen) {
          if (!isMyTurn || currentFen == 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
            _controller.loadFen(serverFen);
            currentFen = serverFen;
          }
        }
      }
    });
  }

  void _onMove(String move) {
    if (mode == 'friend') {
      if (gameData?['status'] != 'playing') return;
      ref.read(socketServiceProvider).makeMove(roomCode!, move);
    } else if (mode == 'ai') {
      // Small delay before AI moves
      Future.delayed(const Duration(milliseconds: 500), () => _makeBestAiMove());
    }
  }

  void _makeBestAiMove() {
    if (!mounted || mode != 'ai') return;
    
    // Simple AI logic for the Flutter version
    final game = _controller.getGame();
    if (game.game_over()) return;

    final moves = game.moves();
    if (moves.isEmpty) return;

    // Greedy AI (picks move with best material value)
    String? bestMove;
    double bestValue = 10000; // AI is black, lower score is better for black in this simple eval

    for (var m in moves) {
      game.move(m);
      double eval = _evaluateBoard(game);
      game.undo();
      
      if (eval < bestValue) {
        bestValue = eval;
        bestMove = m;
      }
    }

    if (bestMove != null) {
      _controller.makeMove(move: bestMove);
      setState(() {
        currentFen = _controller.getFen();
      });
    }
  }

  double _evaluateBoard(dynamic game) {
    final Map<String, double> values = {
      'p': 10, 'n': 30, 'b': 30, 'r': 50, 'q': 90, 'k': 900
    };
    double total = 0;
    
    // In 'chess' package, we can get board state
    for (int i = 0; i < 128; i++) {
      final piece = game.board[i];
      if (piece != null) {
        double val = values[piece.type] ?? 0;
        total += (piece.color == 'w' ? val : -val);
      }
    }
    return total;
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
        title: const Text('Chess Multiplayer', style: TextStyle(color: Colors.white)),
        centerTitle: true,
      ),
      body: mode == null 
        ? _buildModeSelection() 
        : (mode == 'friend' && gameData == null ? _buildFriendSetup() : _buildGameBoard()),
    );
  }

  Widget _buildModeSelection() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _modeButton('ضد صديق', 'Multiplayer Online', LucideIcons.users, Colors.purple, () => setState(() => mode = 'friend')),
          const SizedBox(height: 20),
          _modeButton('ضد الكمبيوتر', 'Play vs AI', LucideIcons.monitor, Colors.blue, () => setState(() {
            mode = 'ai';
            _controller.resetBoard();
            currentFen = _controller.getFen();
          })),
          const SizedBox(height: 20),
          _modeButton('لعب محلي', 'Pass & Play', LucideIcons.swords, Colors.orange, () => setState(() {
            mode = 'local';
            _controller.resetBoard();
            currentFen = _controller.getFen();
          })),
        ],
      ),
    );
  }

  Widget _modeButton(String t, String s, IconData i, Color c, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05), 
          borderRadius: BorderRadius.circular(20), 
          border: Border.all(color: Colors.white.withOpacity(0.1))
        ),
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
            ElevatedButton(
              onPressed: loading ? null : _createRoom,
              style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, minimumSize: const Size(double.infinity, 50)),
              child: const Text('أنشئ غرفة جديدة'),
            ),
            const SizedBox(height: 30),
            const Text('أو ادخل رمز الغرفة', style: TextStyle(color: Colors.white70)),
            const SizedBox(height: 15),
            TextField(
              controller: _codeController,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
              decoration: InputDecoration(
                hintText: 'CODE', 
                hintStyle: const TextStyle(color: Colors.white24),
                filled: true,
                fillColor: Colors.white.withOpacity(0.05),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 15),
            ElevatedButton(
              onPressed: loading ? null : _joinRoom,
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green, minimumSize: const Size(double.infinity, 50)),
              child: const Text('دخول'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGameBoard() {
    if (mode == 'friend' && gameData?['status'] == 'waiting') {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('بانتظار الصديق...', style: TextStyle(color: Colors.white, fontSize: 20)),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              decoration: BoxDecoration(color: Colors.blue.withOpacity(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.blue)),
              child: Text(roomCode ?? '', style: const TextStyle(color: Colors.blue, fontSize: 48, fontWeight: FontWeight.bold, letterSpacing: 5)),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      child: Column(
        children: [
          const SizedBox(height: 20),
          _buildPlayerIndicators(),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: ChessBoard(
              controller: _controller,
              boardColor: BoardColor.brown,
              boardOrientation: _getOrientation(),
              onMove: () {
                 // capture the move in SAN format (backend now supports this)
                 // and send it to the server.
                 try {
                   final san = _controller.getSan();
                   if (san.isNotEmpty) {
                     _onMove(san.last!);
                   }
                 } catch (e) {
                   print('Move capture error: $e');
                 }
              },
            ),
          ),
          if (gameData?['status'] == 'finished') _buildWinnerSection(),
        ],
      ),
    );
  }

  PlayerColor _getOrientation() {
    if (mode == 'local') return PlayerColor.white;
    final currentUser = ref.read(authRepositoryProvider).currentUser;
    final players = gameData?['players'] as List?;
    if (players == null) return PlayerColor.white;
    
    final me = players.firstWhere(
      (p) => (p['user'] is Map ? p['user']['_id'] : p['user'])?.toString() == currentUser?.id,
      orElse: () => null,
    );
    
    return (me != null && me['symbol'] == 'black') ? PlayerColor.black : PlayerColor.white;
  }

  Widget _buildPlayerIndicators() {
    bool myTurn = false;
    final currentUser = ref.read(authRepositoryProvider).currentUser;
    final uId = currentUser?.id ?? '';

    if (mode == 'local') {
      myTurn = true; // Always active in local
    } else {
      final turnData = gameData?['currentTurn'];
      final turnId = (turnData is Map ? turnData['_id'] : turnData)?.toString();
      myTurn = turnId == uId;
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _indicator('أنت', Colors.blue, myTurn),
          _indicator(mode == 'local' ? 'اللاعب 2' : _getOpponentName(), Colors.red, !myTurn),
        ],
      ),
    );
  }

  String _getOpponentName() {
    final currentUser = ref.read(authRepositoryProvider).currentUser;
    final uId = currentUser?.id ?? '';
    final players = gameData?['players'] as List?;
    if (players == null) return 'الخصم';
    
    final opponent = players.firstWhere(
      (p) => (p['user'] is Map ? p['user']['_id'] : p['user'])?.toString() != uId,
      orElse: () => null,
    );

    if (opponent != null && opponent['user'] is Map) {
      return opponent['user']['fullName'] ?? 'الخصم';
    }
    return 'الخصم';
  }

  Widget _indicator(String label, Color color, bool active) {
    return Container(
      padding: const EdgeInsets.all(12),
      constraints: const BoxConstraints(minWidth: 100),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: active ? color : Colors.white.withOpacity(0.1), width: 2),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12), overflow: TextOverflow.ellipsis),
          if (active) const Text('دورك', style: TextStyle(color: Colors.white, fontSize: 9)),
        ],
      ),
    );
  }

  Widget _buildWinnerSection() {
    return Column(
      children: [
        const SizedBox(height: 20),
        const Icon(LucideIcons.trophy, color: Colors.amber, size: 50),
        const Text('انتهت اللعبة!', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
        const SizedBox(height: 20),
        ElevatedButton(onPressed: () => setState(() {
          mode = null;
          gameData = null;
        }), child: const Text('العودة للقائمة')),
      ],
    );
  }

  Future<void> _createRoom() async {
    setState(() => loading = true);
    try {
      final res = await ref.read(gameRepositoryProvider).createGame('chess');
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
}
