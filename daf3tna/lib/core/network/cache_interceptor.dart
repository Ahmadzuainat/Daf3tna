import 'package:dio/dio.dart';

class CacheInterceptor extends Interceptor {
  final Map<String, _CacheResponse> _cache = {};
  final Duration cacheDuration;

  CacheInterceptor({this.cacheDuration = const Duration(minutes: 5)});

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.method != 'GET') return handler.next(options);

    final cacheKey = options.uri.toString();
    final cachedResponse = _cache[cacheKey];

    if (cachedResponse != null && !cachedResponse.isExpired) {
      return handler.resolve(cachedResponse.response);
    }

    return handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (response.requestOptions.method == 'GET') {
      final cacheKey = response.requestOptions.uri.toString();
      _cache[cacheKey] = _CacheResponse(
        response: response,
        expiry: DateTime.now().add(cacheDuration),
      );
    }
    return handler.next(response);
  }
}

class _CacheResponse {
  final Response response;
  final DateTime expiry;

  _CacheResponse({required this.response, required this.expiry});

  bool get isExpired => DateTime.now().isAfter(expiry);
}
