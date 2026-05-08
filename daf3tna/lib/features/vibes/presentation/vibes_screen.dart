import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:daf3tna/features/vibes/presentation/vibe_detail_screen.dart';
import 'package:flutter_animate/flutter_animate.dart';

class VibesScreen extends ConsumerWidget {
  const VibesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final banners = [
      {
        'id': 'instants',
        'title': 'اللقطات الفورية',
        'desc': 'شارك لحظتك العفوية (تختفي بعد المشاهدة)',
        'icon': LucideIcons.zap,
        'colors': [const Color(0xFFF97316), const Color(0xFFEC4899)]
      },
      {
        'id': 'notebooks',
        'title': 'دفاتر التخرج',
        'desc': 'توقيعات ورسائل تبقى للذكرى',
        'icon': LucideIcons.book,
        'colors': [const Color(0xFF2563EB), const Color(0xFF1E3A8A)]
      },
      {
        'id': 'panic',
        'title': 'زر الفزعة',
        'desc': 'اطلب المساعدة العاجلة من الدفعة',
        'icon': LucideIcons.alertTriangle,
        'colors': [const Color(0xFFEF4444), const Color(0xFF991B1B)]
      },
      {
        'id': 'awards',
        'title': 'جوائز الدفعة',
        'desc': 'صوّت لأكثر المواقف والشخصيات المضحكة',
        'icon': LucideIcons.crown,
        'colors': [const Color(0xFFF59E0B), const Color(0xFFB45309)]
      },
      {
        'id': 'quotes',
        'title': 'اقتباسات الدكاترة',
        'desc': 'أجمل وأغرب ما قيل في المحاضرات',
        'icon': LucideIcons.quote,
        'colors': [const Color(0xFF3B82F6), const Color(0xFF1E3A8A)]
      },
      {
        'id': 'confessions',
        'title': 'حائط المجهول',
        'desc': 'اعترف وفضفض براحتك وبسرية تامة',
        'icon': LucideIcons.ghost,
        'colors': [const Color(0xFFD946EF), const Color(0xFF701A75)]
      },
      {
        'id': 'time_capsule',
        'title': 'كبسولة الزمن',
        'desc': 'ذكريات سرية مقفلة حتى يوم التخرج',
        'icon': LucideIcons.lock,
        'colors': [const Color(0xFF10B981), const Color(0xFF065F46)]
      },
    ];

    final screenWidth = MediaQuery.of(context).size.width;
    final crossAxisCount = screenWidth > 600 ? 2 : 1;
    final childAspectRatio = screenWidth > 600 ? 1.8 : 1.6;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          SliverAppBar(
            expandedHeight: 220,
            floating: false,
            pinned: true,
            backgroundColor: AppColors.background,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      AppColors.primary.withValues(alpha: 0.2),
                      AppColors.background,
                    ],
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 40),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.orange.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.orange.withValues(alpha: 0.2)),
                      ),
                      child: const Icon(LucideIcons.flame, size: 40, color: Colors.orange),
                    ).animate().scale(delay: 200.ms, duration: 500.ms, curve: Curves.easeOutBack),
                    const SizedBox(height: 16),
                    const Text(
                      'فعاليات الدفعة',
                      style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    const Text(
                      'أجمل اللحظات التي تجمعنا في الجامعة',
                      style: TextStyle(color: AppColors.textDim, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            sliver: SliverGrid(
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: crossAxisCount,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: childAspectRatio,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) => _buildVibeCard(context, banners[index], index),
                childCount: banners.length,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVibeCard(BuildContext context, Map<String, dynamic> banner, int index) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: banner['colors'] as List<Color>,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: (banner['colors'] as List<Color>).first.withValues(alpha: 0.2),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => VibeDetailScreen(vibe: banner)),
            );
          },
          borderRadius: BorderRadius.circular(24),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    const Icon(LucideIcons.chevronLeft, color: Colors.white, size: 18),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(banner['icon'] as IconData, color: Colors.white, size: 20),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      banner['title'] as String,
                      style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      banner['desc'] as String,
                      textAlign: TextAlign.right,
                      style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 12, height: 1.3),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    ).animate().fadeIn(delay: (index * 100).ms).slideY(begin: 0.2);
  }
}
