import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:daf3tna/core/theme/app_theme.dart';
import 'package:daf3tna/core/router/app_router.dart';
import 'package:daf3tna/core/widgets/global_socket_listener.dart';
import 'package:timeago/timeago.dart' as timeago;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize timeago with Arabic
  timeago.setLocaleMessages('ar', timeago.ArMessages());
  
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

    return GlobalSocketListener(
      child: MaterialApp.router(
        title: 'Daf3tna - دفعتنا',
        theme: AppTheme.darkTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.dark,
        routerConfig: router,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
