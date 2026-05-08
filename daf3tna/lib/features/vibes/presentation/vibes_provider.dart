import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:daf3tna/features/vibes/data/vibes_repository.dart';

final vibesListProvider = FutureProvider.family<List<dynamic>, String>((ref, type) async {
  return ref.watch(vibesRepositoryProvider).fetchVibes(type);
});

final notebookProvider = FutureProvider<List<dynamic>>((ref) async {
  return ref.watch(vibesRepositoryProvider).fetchVibes('notebooks');
});

final awardsProvider = FutureProvider<List<dynamic>>((ref) async {
  return ref.watch(vibesRepositoryProvider).fetchVibes('awards');
});

final confessionsProvider = FutureProvider<List<dynamic>>((ref) async {
  return ref.watch(vibesRepositoryProvider).fetchVibes('confessions');
});

final quotesProvider = FutureProvider<List<dynamic>>((ref) async {
  return ref.watch(vibesRepositoryProvider).fetchVibes('quotes');
});

final panicsProvider = FutureProvider<List<dynamic>>((ref) async {
  return ref.watch(vibesRepositoryProvider).fetchVibes('panic');
});

final timeCapsulesProvider = FutureProvider<List<dynamic>>((ref) async {
  return ref.watch(vibesRepositoryProvider).fetchVibes('time_capsule');
});

final instantsProvider = FutureProvider<List<dynamic>>((ref) async {
  return ref.watch(vibesRepositoryProvider).fetchVibes('instants');
});
