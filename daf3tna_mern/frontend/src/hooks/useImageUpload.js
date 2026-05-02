import { useState } from 'react';
import { toast } from 'sonner';
import api from '../services/api';

export const useImageUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadImage = async (file, folder = 'general') => {
    if (!file) return null;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Note: We use a generic upload endpoint if we have one, 
      // or we handle it in specific route controllers.
      // For profile, we use /users/profile. For posts, we use /posts.
      // So this hook might need to return the formData or handle the specific call.
      
      setUploadProgress(50);
      // ... actual upload logic usually happens in the component's submit handler 
      // where we append files to the specific feature's FormData.
      
      return file;
    } catch (err) {
      toast.error('خطأ في معالجة الصورة');
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return { uploadImage, isUploading, uploadProgress };
};
