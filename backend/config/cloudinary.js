import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dvrp6x0ay',
  api_key: process.env.CLOUDINARY_API_KEY || '172819863437379',
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default cloudinary;
