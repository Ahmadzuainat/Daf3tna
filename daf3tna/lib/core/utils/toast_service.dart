import 'package:flutter/material.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:lucide_icons/lucide_icons.dart';

class ToastService {
  static void showSuccess(BuildContext context, String message) {
    _showToast(context, message, AppColors.success, LucideIcons.checkCircle);
  }

  static void showError(BuildContext context, String message) {
    _showToast(context, message, AppColors.error, LucideIcons.alertCircle);
  }

  static void showInfo(BuildContext context, String message) {
    _showToast(context, message, AppColors.primary, LucideIcons.info);
  }

  static void _showToast(BuildContext context, String message, Color color, IconData icon) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        elevation: 0,
        behavior: SnackBarBehavior.floating,
        backgroundColor: Colors.transparent,
        content: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color.withOpacity(0.3)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 10,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  message,
                  textAlign: TextAlign.right,
                  style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
