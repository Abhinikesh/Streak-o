import cloudinary from '../config/cloudinary.js';
import pkg from 'multer-storage-cloudinary';
const { CloudinaryStorage } = pkg;
import multer from 'multer';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'streakboard/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 200, height: 200, crop: 'fill' }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
});

export default upload;
