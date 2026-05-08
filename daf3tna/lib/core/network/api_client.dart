import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:daf3tna/core/storage/secure_storage_service.dart';
import 'dart:developer' as dev;
import 'package:daf3tna/core/network/cache_interceptor.dart';

final apiClientProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: 'https://daf3tna.onrender.com/api',
      connectTimeout: const Duration(seconds: 45),
      receiveTimeout: const Duration(seconds: 45),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );


  dio.interceptors.add(CacheInterceptor());
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await ref.read(secureStorageServiceProvider).getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        dev.log('API REQUEST [${options.method}] => ${options.path}');
        return handler.next(options);
      },
      onResponse: (response, handler) {
        dev.log('API RESPONSE [${response.statusCode}] <= ${response.requestOptions.path}');
        return handler.next(response);
      },
      onError: (DioException e, handler) {
        dev.log('API ERROR [${e.response?.statusCode}] !! ${e.message}');
        
        if (e.response?.statusCode == 401) {
          ref.read(secureStorageServiceProvider).deleteToken();
        }

        // Transform error to user-friendly message if possible
        String message = 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً';
        if (e.type == DioExceptionType.connectionTimeout) message = 'انتهت مهلة الاتصال بالخادم';
        if (e.type == DioExceptionType.connectionError) message = 'لا يوجد اتصال بالإنترنت';
        if (e.response?.data != null && e.response?.data is Map) {
          message = e.response?.data['message'] ?? message;
        }

        // Create a custom error object for the UI to consume
        final customError = DioException(
          requestOptions: e.requestOptions,
          response: e.response,
          type: e.type,
          error: message,
        );

        return handler.next(customError);
      },
    ),
  );

  return dio;
});
