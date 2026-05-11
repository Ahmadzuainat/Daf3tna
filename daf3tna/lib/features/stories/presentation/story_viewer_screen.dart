import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/models/social_models.dart';
import 'package:daf3tna/features/feed/data/social_repository.dart';
import 'package:daf3tna/features/auth/data/auth_repository.dart';
import 'package:daf3tna/features/feed/presentation/widgets/stories_bar.dart';
import 'package:flutter/services.dart';
import 'dart:async';

class StoryViewerScreen extends ConsumerStatefulWidget {
  final List<StoryModel> stories;
  final int initialIndex;

  const StoryViewerScreen({
    super.key,
    required this.stories,
    this.initialIndex = 0,
  });

  @override
  ConsumerState<StoryViewerScreen> createState() => _StoryViewerScreenState();
}

class _StoryViewerScreenState extends ConsumerState<StoryViewerScreen> with SingleTickerProviderStateMixin {
  late PageController _pageController;
  late AnimationController _animController;
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
    _animController = AnimationController(vsync: this);

    _loadStory(story: widget.stories[_currentIndex], animateToPage: false);

    _animController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _animController.stop();
        _animController.reset();
        setState(() {
          if (_currentIndex + 1 < widget.stories.length) {
            _currentIndex++;
            _loadStory(story: widget.stories[_currentIndex]);
          } else {
            Navigator.pop(context);
          }
        });
      }
    });
  }

  void _loadStory({required StoryModel story, bool animateToPage = true}) {
    _animController.stop();
    _animController.reset();
    _animController.duration = const Duration(seconds: 5);
    _animController.forward();

    if (animateToPage) {
      _pageController.animateToPage(
        _currentIndex,
        duration: const Duration(milliseconds: 1),
        curve: Curves.easeInOut,
      );
    }

    // Mark as viewed in background
    ref.read(socialRepositoryProvider).viewStory(story.id);
  }

  @override
  void dispose() {
    _pageController.dispose();
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final story = widget.stories[_currentIndex];

    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTapDown: (details) => _animController.stop(),
        onTapUp: (details) {
          final double screenWidth = MediaQuery.of(context).size.width;
          final double dx = details.globalPosition.dx;
          if (dx < screenWidth / 3) {
            if (_currentIndex - 1 >= 0) {
              setState(() {
                _currentIndex--;
                _loadStory(story: widget.stories[_currentIndex]);
              });
            }
          } else {
            if (_currentIndex + 1 < widget.stories.length) {
              setState(() {
                _currentIndex++;
                _loadStory(story: widget.stories[_currentIndex]);
              });
            } else {
              Navigator.pop(context);
            }
          }
        },
        onLongPress: () => _animController.stop(),
        onLongPressUp: () => _animController.forward(),
        child: Stack(
          children: [
            PageView.builder(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: widget.stories.length,
              itemBuilder: (context, index) {
                return CachedNetworkImage(
                  imageUrl: widget.stories[index].mediaUrl,
                  fit: BoxFit.contain,
                  placeholder: (context, url) => const Center(child: CircularProgressIndicator()),
                  errorWidget: (context, url, error) => const Icon(Icons.error),
                );
              },
            ),
            Positioned(
              top: 40,
              left: 10,
              right: 10,
              child: Column(
                children: [
                  Row(
                    children: widget.stories.asMap().entries.map((e) {
                      return Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2),
                          child: AnimatedBar(
                            animController: _animController,
                            position: e.key,
                            currentIndex: _currentIndex,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 18,
                        backgroundImage: CachedNetworkImageProvider(story.user.avatarUrl ?? ''),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        story.user.fullName,
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                      const Spacer(),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // Bottom Actions: Like
            Positioned(
              bottom: 40,
              left: 20,
              right: 20,
              child: Row(
                children: [
                  const Spacer(),
                  GestureDetector(
                    onTap: () async {
                      HapticFeedback.mediumImpact();
                      try {
                        await ref.read(socialRepositoryProvider).toggleStoryLike(story.id);
                        setState(() {
                          final userId = ref.read(currentUserProvider)?.id;
                          if (userId != null) {
                            if (story.likes.contains(userId)) {
                              story.likes.remove(userId);
                            } else {
                              story.likes.add(userId);
                            }
                          }
                        });
                        ref.invalidate(storiesProvider);
                      } catch (e) {}
                    },
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.black38,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white24),
                      ),
                      child: Icon(
                        story.likes.contains(ref.watch(currentUserProvider)?.id)
                            ? Icons.favorite
                            : Icons.favorite_border,
                        color: story.likes.contains(ref.watch(currentUserProvider)?.id)
                            ? Colors.red
                            : Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class AnimatedBar extends StatelessWidget {
  final AnimationController animController;
  final int position;
  final int currentIndex;

  const AnimatedBar({
    super.key,
    required this.animController,
    required this.position,
    required this.currentIndex,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Stack(
          children: [
            _buildContainer(
              double.infinity,
              position < currentIndex ? Colors.white : Colors.white.withOpacity(0.3),
            ),
            position == currentIndex
                ? AnimatedBuilder(
                    animation: animController,
                    builder: (context, child) {
                      return _buildContainer(
                        constraints.maxWidth * animController.value,
                        Colors.white,
                      );
                    },
                  )
                : const SizedBox.shrink(),
          ],
        );
      },
    );
  }

  Container _buildContainer(double width, Color color) {
    return Container(
      height: 3,
      width: width,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(3),
      ),
    );
  }
}
