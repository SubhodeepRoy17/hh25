import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImages = async (files: File[]) => {
  const uploadPromises = files.map(async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return new Promise<{ url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'smartsurplus' }, (error, result) => {
          if (error) {
            reject(error);
            return;
          }
          resolve({ url: result!.secure_url });
        })
        .end(buffer);
    });
  });

  return Promise.all(uploadPromises);
};