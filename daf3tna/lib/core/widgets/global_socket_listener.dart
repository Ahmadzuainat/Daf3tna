import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:daf3tna/core/network/socket_service.dart';
import 'package:daf3tna/core/utils/toast_service.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart';
import 'package:daf3tna/features/auth/presentation/login_screen.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';

class GlobalSocketListener extends ConsumerStatefulWidget {
  final Widget child;
  const GlobalSocketListener({super.key, required this.child});

  @override
  ConsumerState<GlobalSocketListener> createState() => _GlobalSocketListenerState();
}

class _GlobalSocketListenerState extends ConsumerState<GlobalSocketListener> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _setupListeners();
    });
  }

  void _setupListeners() {
    final socketService = ref.read(socketServiceProvider);
    
    // Connect if not connected
    socketService.connect();

    // Panic Alert
    socketService.onPanicAlert((data) {
      if (!mounted) return;
      _showPanicDialog(data);
    });

    socketService.socket?.on('force:logout', (data) {
      if (!mounted) return;
      final reason = data['reason'] ?? 'تم تسجيل خروجك من قبل المسؤول';
      ToastService.showError(context, reason);
    });

    socketService.socket?.on('global:alert', (data) {
      if (!mounted) return;
      final message = data['message'] ?? '';
      ToastService.showInfo(context, message);
    });

    // We can add more listeners here if needed, 
    // although some are already in socket_service.dart (force:logout, global:alert)
    // But those use ToastService which is fine.
    // Let's add specialized handling for panic which is a "WOW" feature.
  }

  void _showPanicDialog(Map<String, dynamic> data) {
    final user = data['user'] ?? {};
    final message = data['message'] ?? 'طلب مساعدة عاجل!';
    final location = data['location'];

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF1E1E2E),
            borderRadius: BorderRadius.circular(32),
            border: Border.all(color: Colors.redAccent.withOpacity(0.5), width: 2),
            boxShadow: [
              BoxShadow(color: Colors.redAccent.withOpacity(0.2), blurRadius: 40, spreadRadius: 10)
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(LucideIcons.alertTriangle, color: Colors.redAccent, size: 64),
              const SizedBox(height: 24),
              const Text(
                'تنبيه طوارئ عاجل!',
                style: TextStyle(color: Colors.redAccent, fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              Text(
                'المستخدم ${user['fullName'] ?? 'زميل'} بحاجة لمساعدة:',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, fontSize: 14),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  message,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white10,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Text('تجاهل'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        // Future: Navigate to map or specific chat
                        ToastService.showInfo(context, 'تم استلام الإشارة، شكراً لمساعدتك!');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.redAccent,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Text('تقديم المساعدة'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
