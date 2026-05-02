import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/glass_card.dart';

class HubsScreen extends StatelessWidget {
  const HubsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Hobbies & Hubs'),
        actions: [
          IconButton(icon: const Icon(Icons.add), onPressed: () {}),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: [
          _buildHubCategory(context, 'Gaming 🎮', [
            _HubItem(name: 'Valorant Squad', members: 45),
            _HubItem(name: 'FIFA 24', members: 120),
            _HubItem(name: 'League of Legends', members: 32),
          ]),
          const SizedBox(height: 24),
          _buildHubCategory(context, 'Study Groups 📚', [
            _HubItem(name: 'CS101 Final Prep', members: 89),
            _HubItem(name: 'Math Help', members: 210),
          ]),
          const SizedBox(height: 24),
          _buildHubCategory(context, 'Interests 🎨', [
            _HubItem(name: 'Anime & Manga', members: 156),
            _HubItem(name: 'Photography', members: 43),
            _HubItem(name: 'Gym Bros', members: 200),
          ]),
        ],
      ),
    );
  }

  Widget _buildHubCategory(BuildContext context, String title, List<_HubItem> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: AppTheme.primaryPurple,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        ...items.map((item) => Padding(
          padding: const EdgeInsets.only(bottom: 8.0),
          child: GlassCard(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceDark,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.tag, color: AppTheme.primaryBlue),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      Text('${item.members} members online', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: Colors.white54),
              ],
            ),
          ),
        )),
      ],
    );
  }
}

class _HubItem {
  final String name;
  final int members;
  _HubItem({required this.name, required this.members});
}
