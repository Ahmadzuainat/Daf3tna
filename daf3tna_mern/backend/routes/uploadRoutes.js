import express from 'express';
import { upload, uploadToCloudinary } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Generic Cloudinary Upload
router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'لم يتم رفع أي ملف' });
  }

  try {
    const folder = req.body.folder || 'general';
    const result = await uploadToCloudinary(req.file.buffer, folder);
    
    res.json({
      success: true,
      message: 'تم رفع الصورة بنجاح',
      imageUrl: result.secure_url,
      publicId: result.public_id
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الرفع إلى السحابة', error: error.message });
  }
});

export default router;
