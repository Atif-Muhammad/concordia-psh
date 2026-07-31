import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import {
  IMAGE_UPLOAD_MAX_BYTES,
  IMAGE_UPLOAD_MIME_TYPES,
} from '../validation/pk-validation';

export const imageUploadOptions: MulterOptions = {
  limits: { fileSize: IMAGE_UPLOAD_MAX_BYTES },
  fileFilter: (_req, file, callback) => {
    const originalName = String(file.originalname || '').toLowerCase();
    const hasAllowedExtension = ['.png', '.jpg', '.jpeg'].some((extension) =>
      originalName.endsWith(extension),
    );
    if (!IMAGE_UPLOAD_MIME_TYPES.includes(file.mimetype) || !hasAllowedExtension) {
      callback(
        new BadRequestException('Image must be PNG, JPG, or JPEG and 10 MB or smaller.'),
        false,
      );
      return;
    }
    callback(null, true);
  },
};
