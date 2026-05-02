import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// TODO: Replace with real keys
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';

final supabaseProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});
