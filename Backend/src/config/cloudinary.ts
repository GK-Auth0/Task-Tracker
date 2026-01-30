import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dnva8natm',
  api_key: process.env.CLOUDINARY_API_KEY || '347778292363172',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'M97B8u2XvHYqH7h7k2n3pyZTZa4'
});

export default cloudinary;