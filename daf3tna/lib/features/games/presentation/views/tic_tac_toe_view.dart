import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/core/services/socket_service.dart';
import 'package:daf3tna/features/games/data/game_repository.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart';

class TicTacToeView extends ConsumerStatefulWidget {
  const TicTacToeView({super.key});

  @override
  ConsumerState<TicTacToeView> createState() => _TicTacToeViewState();
}

class _TicTacToeViewState extends ConsumerState<TicTacToeView> {
  String? mode; 
  Map<String, dynamic>? gameData;
  List<String?> aiBoard = List.filled(9, null);
  bool isAiThinking = false;
  String? aiWinner;
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

  String difficulty = 'hard'; // 'easy', 'medium', 'hard'

  void _handleAIMove(int index) {
    if (aiBoard[index] != null || aiWinner != null || isAiThinking) return;

    setState(() {
      aiBoard[index] = 'X';
      aiWinner = _checkWinner(aiBoard);
    });

    if (aiWinner != null || !aiBoard.contains(null)) {
      if (aiWinner == null) setState(() => aiWinner = 'draw');
      return;
    }

    setState(() => isAiThinking = true);
    Timer(const Duration(milliseconds: 600), () {
      if (!mounted) return;
      
      int? aiIndex;
      if (difficulty == 'easy') {
        final emptyIndices = <int>[];
        for (int i = 0; i < aiBoard.length; i++) {
          if (aiBoard[i] == null) emptyIndices.add(i);
        }
        if (emptyIndices.isNotEmpty) {
          aiIndex = emptyIndices[Random().nextInt(emptyIndices.length)];
        }
      } else if (difficulty == 'medium') {
        if (Random().nextDouble() > 0.5) {
          aiIndex = _getBestMove(aiBoard);
        } else {
          final emptyIndices = <int>[];
          for (int i = 0; i < aiBoard.length; i++) {
            if (aiBoard[i] == null) emptyIndices.add(i);
          }
          if (emptyIndices.isNotEmpty) {
            aiIndex = emptyIndices[Random().nextInt(emptyIndices.length)];
          }
        }
      } else {
        aiIndex = _getBestMove(aiBoard);
      }

      if (aiIndex != null) {
        setState(() {
          aiBoard[aiIndex!] = 'O';
          aiWinner = _checkWinner(aiBoard);
          if (aiWinner == null && !aiBoard.contains(null)) aiWinner = 'draw';
        });
      }
      setState(() => isAiThinking = false);
    });
  }

  int? _getBestMove(List<String?> board) {
    int bestScore = -1000;
    int? move;
    for (int i = 0; i < 9; i++) {
      if (board[i] == null) {
        board[i] = 'O';
        int score = _minimax(board, 0, false);
        board[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  }

  int _minimax(List<String?> board, int depth, bool isMaximizing) {
    String? result = _checkWinner(board);
    if (result == 'O') return 10 - depth;
    if (result == 'X') return depth - 10;
    if (!board.contains(null)) return 0;

    if (isMaximizing) {
      int bestScore = -1000;
      for (int i = 0; i < 9; i++) {
        if (board[i] == null) {
          board[i] = 'O';
          int score = _minimax(board, depth + 1, false);
          board[i] = null;
          bestScore = max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      int bestScore = 1000;
      for (int i = 0; i < 9; i++) {
        if (board[i] == null) {
          board[i] = 'X';
          int score = _minimax(board, depth + 1, true);
          board[i] = null;
          bestScore = min(score, bestScore);
        }
      }
      return bestScore;
    }
  }

  String? _checkWinner(List<String?> board) {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (var line in lines) {
      if (board[line[0]] != null &&
          board[line[0]] == board[line[1]] &&
          board[line[0]] == board[line[2]]) {
        return board[line[0]];
      }
    }
    return null;
  }

  void _makeMove(int index) {
    if (mode == 'ai') {
      _handleAIMove(index);
    } else {
      if (gameData?['status'] != 'playing') return;
      ref.read(socketServiceProvider).makeMove(roomCode!, {'index': index});
    }
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

    final board = mode == 'ai' ? aiBoard : List<String?>.from(gameData?['gameState']?['board'] ?? List.filled(9, null));
    return SingleChildScrollView(
      child: Column(
        children: [
          const SizedBox(height: 30),
          _buildPlayerIndicators(),
          const SizedBox(height: 40),
          _buildGrid(board),
          if ((mode == 'ai' && aiWinner != null) || (gameData?['status'] == 'finished')) _buildWinnerSection(),
        ],
      ),
    );
  }

  Widget _buildPlayerIndicators() {
    bool myTurn = false;
    final currentUser = ref.read(authRepositoryProvider).currentUser;
    final uId = currentUser?.id ?? '';

    if (mode == 'ai') {
      myTurn = !isAiThinking && aiWinner == null;
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
          _indicator('أنت (X)', Colors.blue, myTurn),
          _indicator(
            mode == 'ai' 
              ? 'الكمبيوتر (O)' 
              : (_getOpponentName() + ' (O)'), 
            Colors.red, 
            !myTurn
          ),
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
      (p) {
        final pId = (p['user'] is Map ? p['user']['_id'] : p['user'])?.toString();
        return pId != uId;
      },
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
          if (active) Text(isAiThinking ? 'يفكر...' : 'دورك', style: const TextStyle(color: Colors.white, fontSize: 9)),
        ],
      ),
    );
  }

  Widget _buildGrid(List<String?> board) {
    return Container(
      width: 350, height: 350,
      padding: const EdgeInsets.all(16),
      child: GridView.builder(
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, crossAxisSpacing: 15, mainAxisSpacing: 15),
        itemCount: 9,
        itemBuilder: (c, i) => GestureDetector(
          onTap: () => _makeMove(i),
          child: Container(
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white.withOpacity(0.05))),
            child: Center(
              child: board[i] == null 
                ? null 
                : (board[i] == 'X' 
                    ? const Icon(LucideIcons.x, color: Colors.blue, size: 50) 
                    : const Icon(LucideIcons.circle, color: Colors.red, size: 45)),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildWinnerSection() {
    String msg = '';
    if (mode == 'ai') {
      msg = aiWinner == 'draw' ? 'تعادل!' : (aiWinner == 'X' ? 'لقد فزت! 🎉' : 'خسرت! 🤖');
    } else {
      msg = 'انتهت اللعبة!';
    }
    return Column(
      children: [
        const SizedBox(height: 20),
        const Icon(LucideIcons.trophy, color: Colors.amber, size: 50),
        const SizedBox(height: 10),
        Text(msg, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
        const SizedBox(height: 20),
        ElevatedButton(onPressed: () => setState(() {
          mode = null;
          aiBoard = List.filled(9, null);
          aiWinner = null;
          gameData = null;
        }), child: const Text('العودة للقائمة')),
      ],
    );
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
}
