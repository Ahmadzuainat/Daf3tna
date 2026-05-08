import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:daf3tna/features/auth/presentation/login_screen.dart';
import 'package:daf3tna/features/auth/presentation/register_screen.dart';
import 'package:daf3tna/features/home/presentation/main_screen.dart';
import 'package:daf3tna/core/storage/secure_storage_service.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) async {
      final token = await ref.read(secureStorageServiceProvider).getToken();
      final isLoggingIn = state.matchedLocation == '/login' || state.matchedLocation == '/register';

      if (token == null && !isLoggingIn) return '/login';
      if (token != null && isLoggingIn) return '/';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/',
        builder: (context, state) => const MainScreen(),
      ),
    ],
  );
});
