import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  // TODO: Initialize Supabase here
  
  runApp(
    const ProviderScope(
      child: Daf3tnaApp(),
    ),
  );
}

class Daf3tnaApp extends ConsumerWidget {
  const Daf3tnaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterProvider);

    return MaterialApp.router(
      title: 'Daf3tna - دفعتنا',
      theme: AppTheme.darkTheme, // Defaulting to dark mode as requested
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.dark,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
