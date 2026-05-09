class ImageUtils {
  static String getOptimizedUrl(String? url, {int width = 600}) {
    if (url == null || url.isEmpty) return "";
    
    // Cloudinary Optimization
    if (url.contains('cloudinary.com')) {
      return url.replaceFirst('/upload/', '/upload/w_$width,q_auto,f_auto/');
    }
    
    return url;
  }
}
