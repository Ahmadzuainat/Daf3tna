import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
// import 'package:socket_io_client/socket_io_client.dart' as IO;

class TicTacToeView extends StatefulWidget {
  const TicTacToeView({super.key});

  @override
  State<TicTacToeView> createState() => _TicTacToeViewState();
}

class _TicTacToeViewState extends State<TicTacToeView> {
  String? mode; // 'ai', 'friend'
  List<String?> board = List.filled(9, null);
  String turn = 'X';
  String? winner;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowRight, color: Colors.white),
          onPressed: () => mode == null ? Navigator.pop(context) : setState(() => mode = null),
        ),
        title: Text(mode == null ? 'Tic Tac Toe' : (mode == 'ai' ? 'ضد الكمبيوتر' : 'لعب جماعي'), style: const TextStyle(color: Colors.white)),
        centerTitle: true,
      ),
      body: mode == null ? _buildModeSelection() : _buildGameBoard(),
    );
  }

  Widget _buildModeSelection() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _buildModeButton(
            title: 'اللعب ضد الكمبيوتر',
            subtitle: 'تحدى الذكاء الاصطناعي',
            icon: LucideIcons.monitor,
            color: Colors.blue,
            onTap: () => setState(() => mode = 'ai'),
          ),
          const SizedBox(height: 20),
          _buildModeButton(
            title: 'اللعب مع صديق',
            subtitle: 'تحدى صديقك في الوقت الفعلي',
            icon: LucideIcons.users,
            color: Colors.purple,
            onTap: () => setState(() => mode = 'friend'),
          ),
        ],
      ),
    );
  }

  Widget _buildModeButton({required String title, required String subtitle, required IconData icon, required Color color, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
          borderRadius: BorderRadius.circular(24),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(16)),
              child: Icon(icon, color: Colors.white, size: 28),
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  Text(subtitle, style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGameBoard() {
    return Column(
      children: [
        const SizedBox(height: 40),
        _buildTurnIndicator(),
        const SizedBox(height: 40),
        _buildGrid(),
        if (winner != null) _buildWinnerCard(),
      ],
    );
  }

  Widget _buildTurnIndicator() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _playerCard('X', 'أنت', turn == 'X'),
        const SizedBox(width: 40),
        _playerCard('O', mode == 'ai' ? 'الكمبيوتر' : 'الخصم', turn == 'O'),
      ],
    );
  }

  Widget _playerCard(String symbol, String label, bool isActive) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        border: Border.all(color: isActive ? (symbol == 'X' ? Colors.blue : Colors.red) : Colors.white.withOpacity(0.1)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Text(symbol, style: TextStyle(color: symbol == 'X' ? Colors.blue : Colors.red, fontSize: 24, fontWeight: FontWeight.bold)),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildGrid() {
    return Container(
      width: 350,
      height: 350,
      padding: const EdgeInsets.all(12),
      child: GridView.builder(
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 3, crossAxisSpacing: 12, mainAxisSpacing: 12),
        itemCount: 9,
        itemBuilder: (context, index) {
          return GestureDetector(
            onTap: () => _handleMove(index),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withOpacity(0.1)),
              ),
              child: Center(
                child: board[index] == null
                    ? null
                    : (board[index] == 'X'
                        ? const Icon(LucideIcons.x, size: 48, color: Colors.blue)
                        : const Icon(LucideIcons.circle, size: 40, color: Colors.red)),
              ),
            ),
          );
        },
      ),
    );
  }

  void _handleMove(int index) {
    if (board[index] != null || winner != null) return;
    setState(() {
      board[index] = 'X';
      if (_checkWin('X')) {
        winner = 'X';
      } else if (!board.contains(null)) {
        winner = 'draw';
      } else {
        if (mode == 'ai') {
          _aiMove();
        } else {
          turn = 'O';
        }
      }
    });
  }

  void _aiMove() {
    Future.delayed(const Duration(milliseconds: 500), () {
      if (!mounted) return;
      List<int> empty = [];
      for (int i = 0; i < 9; i++) {
        if (board[i] == null) empty.add(i);
      }
      if (empty.isNotEmpty) {
        setState(() {
          int move = empty[0]; // Simple AI
          board[move] = 'O';
          if (_checkWin('O')) {
            winner = 'O';
          } else if (!board.contains(null)) {
            winner = 'draw';
          }
        });
      }
    });
  }

  bool _checkWin(String s) {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (var l in lines) {
      if (board[l[0]] == s && board[l[1]] == s && board[l[2]] == s) return true;
    }
    return false;
  }

  Widget _buildWinnerCard() {
    return Column(
      children: [
        const SizedBox(height: 20),
        const Icon(LucideIcons.trophy, color: Colors.amber, size: 60),
        Text(winner == 'draw' ? 'تعادل!' : (winner == 'X' ? 'لقد فزت! 🎉' : 'خسرت! 🤖'),
            style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: () => setState(() {
            board = List.filled(9, null);
            winner = null;
            turn = 'X';
          }),
          child: const Text('العب مرة أخرى'),
        )
      ],
    );
  }
}
