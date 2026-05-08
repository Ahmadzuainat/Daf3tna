import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/search/data/search_repository.dart';
import 'package:daf3tna/models/user_model.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:daf3tna/features/profile/presentation/profile_screen.dart';
import 'dart:async';
import 'package:daf3tna/core/widgets/shimmer_loading.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<UserModel> _results = [];
  List<UserModel> _history = [];
  bool _isLoading = false;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  void _loadHistory() async {
    final history = await ref.read(searchRepositoryProvider).getSearchHistory();
    setState(() => _history = history);
  }

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      if (query.isEmpty) {
        setState(() {
          _results = [];
          _isLoading = false;
        });
        return;
      }
      _performSearch(query);
    });
  }

  void _performSearch(String query) async {
    setState(() => _isLoading = true);
    try {
      final results = await ref.read(searchRepositoryProvider).searchUsers(query);
      setState(() {
        _results = results;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }


  void _handleUserTap(UserModel user) {
    ref.read(searchRepositoryProvider).addToSearchHistory(user.id);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProfileScreen(username: user.username),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildSearchBar(),
            Expanded(
              child: _isLoading
                  ? const _SearchShimmer()
                  : _results.isEmpty && _searchController.text.isEmpty
                      ? _buildHistory()
                      : _buildResults(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withOpacity(0.1)),
        ),
        child: TextField(
          controller: _searchController,
          onChanged: _onSearchChanged,
          textAlign: TextAlign.right,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'ابحث عن زملائك...',
            hintStyle: const TextStyle(color: AppColors.textMuted),
            prefixIcon: const Icon(LucideIcons.search, color: AppColors.textMuted, size: 20),
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(LucideIcons.x, color: AppColors.textMuted, size: 16),
                    onPressed: () {
                      _searchController.clear();
                      _onSearchChanged('');
                    },
                  )
                : null,
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          ),
        ),
      ),
    );
  }

  Widget _buildHistory() {
    if (_history.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.search, size: 64, color: Colors.white.withOpacity(0.1)),
            const SizedBox(height: 16),
            const Text('ابدأ البحث عن مستخدمين', style: TextStyle(color: AppColors.textDim)),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text('عمليات البحث الأخيرة', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: _history.length,
            itemBuilder: (context, index) => _buildUserTile(_history[index]),
          ),
        ),
      ],
    );
  }

  Widget _buildResults() {
    if (_results.isEmpty && _searchController.text.isNotEmpty) {
      return const Center(child: Text('لا يوجد نتائج', style: TextStyle(color: AppColors.textDim)));
    }

    return ListView.builder(
      itemCount: _results.length,
      itemBuilder: (context, index) => _buildUserTile(_results[index]),
    );
  }

  Widget _buildUserTile(UserModel user) {
    return ListTile(
      onTap: () => _handleUserTap(user),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: CircleAvatar(
        radius: 24,
        backgroundImage: CachedNetworkImageProvider(user.avatarUrl ?? ''),
      ),
      title: Text(
        user.fullName,
        textAlign: TextAlign.right,
        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
      ),
      subtitle: Text(
        '@${user.username} • ${user.major ?? ""}',
        textAlign: TextAlign.right,
        style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
      ),
      trailing: const Icon(LucideIcons.chevronLeft, color: Colors.white24, size: 18),
    );
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }
}

class _SearchShimmer extends StatelessWidget {
  const _SearchShimmer();

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: 5,
      itemBuilder: (context, index) => const ListTile(
        leading: ShimmerLoading.circular(width: 48, height: 48),
        title: ShimmerLoading.rectangular(height: 12),
        subtitle: Padding(
          padding: EdgeInsets.only(top: 8),
          child: ShimmerLoading.rectangular(height: 10, width: 100),
        ),
      ),
    );
  }
}
