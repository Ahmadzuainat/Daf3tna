import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/features/search/data/search_repository.dart';
import 'package:daf3tna/models/user_model.dart';
import 'package:daf3tna/features/profile/presentation/profile_screen.dart';

class YearbookScreen extends ConsumerStatefulWidget {
  const YearbookScreen({super.key});

  @override
  ConsumerState<YearbookScreen> createState() => _YearbookScreenState();
}

class _YearbookScreenState extends ConsumerState<YearbookScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<UserModel> _allUsers = [];
  List<UserModel> _filteredUsers = [];
  bool _isLoading = true;
  bool _isMoreLoading = false;
  int _currentPage = 1;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _fetchUsers(1);
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200 &&
        _hasMore &&
        !_isMoreLoading) {
      _fetchUsers(_currentPage + 1);
    }
  }

  Future<void> _fetchUsers(int page) async {
    if (page > 1) {
      setState(() => _isMoreLoading = true);
    }

    try {
      final users = await ref.read(searchRepositoryProvider).getBatchUsers(page: page);
      if (mounted) {
        setState(() {
          if (page == 1) {
            _allUsers = users;
          } else {
            _allUsers.addAll(users);
          }
          _filteredUsers = _allUsers;
          _isLoading = false;
          _isMoreLoading = false;
          _currentPage = page;
          _hasMore = users.length == 20;
        });
      }
    } catch (e) {
      if (mounted) setState(() {
        _isLoading = false;
        _isMoreLoading = false;
      });
    }
  }

  void _filterUsers(String query) {
    setState(() {
      _filteredUsers = _allUsers
          .where((user) =>
              user.fullName.toLowerCase().contains(query.toLowerCase()) ||
              user.username.toLowerCase().contains(query.toLowerCase()))
          .toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              const Text(
                'كتاب السنة 2026',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                  color: Colors.white,
                ),
              ),
              Container(
                width: 60,
                height: 4,
                margin: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 24),
              Container(
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withOpacity(0.1)),
                ),
                child: TextField(
                  controller: _searchController,
                  onChanged: _filterUsers,
                  textAlign: TextAlign.right,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'ابحث عن زميل...',
                    hintStyle: TextStyle(color: AppColors.textMuted),
                    prefixIcon: Icon(LucideIcons.search, color: AppColors.textMuted, size: 20),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _filteredUsers.isEmpty
                        ? const Center(child: Text('لا يوجد طلاب', style: TextStyle(color: AppColors.textDim)))
                        : GridView.builder(
                            controller: _scrollController,
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              childAspectRatio: 0.8,
                              crossAxisSpacing: 16,
                              mainAxisSpacing: 16,
                            ),
                            itemCount: _filteredUsers.length + (_isMoreLoading ? 2 : 0),
                            itemBuilder: (context, index) {
                              if (index >= _filteredUsers.length) {
                                return const Center(child: CircularProgressIndicator());
                              }
                              return _buildYearbookCard(_filteredUsers[index]);
                            },
                          ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildYearbookCard(UserModel user) {
    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => ProfileScreen(username: user.username)),
        );
      },
      borderRadius: BorderRadius.circular(20),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.03),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(3),
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.primaryGradient,
              ),
              child: CircleAvatar(
                radius: 40,
                backgroundImage: CachedNetworkImageProvider(user.avatarUrl ?? 'https://via.placeholder.com/150'),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              user.fullName,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
            ),
            Text(
              '@${user.username}',
              style: const TextStyle(color: AppColors.textDim, fontSize: 12),
            ),
            if (user.major != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  user.major!,
                  style: TextStyle(color: AppColors.primary.withOpacity(0.7), fontSize: 10, fontWeight: FontWeight.bold),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
