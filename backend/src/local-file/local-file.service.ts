import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class LocalFileService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Upload a file to local storage.
   * @param file - The multer file object
   * @param subfolder - e.g. 'students/ali-khan' or 'staff/dr-ahmed'
   */
  async uploadFile(file: Express.Multer.File, subfolder?: string) {
    const fileHash = crypto.createHash('md5').update(file.buffer).digest('hex');
    const ext = path.extname(file.originalname);
    const filename = `${fileHash}${ext}`;

    const targetDir = subfolder
      ? path.join(this.uploadDir, subfolder)
      : this.uploadDir;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filePath = path.join(targetDir, filename);

    try {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, file.buffer);
      }

      const baseUrl = process.env.BACKEND_URL || 'http://localhost:3003';
      const relativePath = subfolder
        ? `uploads/${subfolder}/${filename}`
        : `uploads/${filename}`;
      const url = `${baseUrl}/${relativePath}`;

      return {
        url,
        public_id: subfolder ? `${subfolder}/${filename}` : filename,
      };
    } catch (error) {
      console.error('Local file upload error:', error);
      throw new InternalServerErrorException(
        'Failed to save file to local storage',
      );
    }
  }

  /**
   * Remove a file from local storage.
   * @param fileId - The public_id returned by uploadFile (may include subfolder path), or a full URL
   */
  async removeFile(fileId: string) {
    // If it's a full URL, extract the relative path after /uploads/
    if (fileId.startsWith('http')) {
      const uploadsIndex = fileId.indexOf('/uploads/');
      if (uploadsIndex !== -1) {
        fileId = fileId.substring(uploadsIndex + '/uploads/'.length);
      } else {
        fileId = path.basename(fileId);
      }
    }

    const filePath = path.join(this.uploadDir, fileId);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);

        // Try to remove the parent directory if it's now empty
        const parentDir = path.dirname(filePath);
        if (
          parentDir !== this.uploadDir &&
          fs.existsSync(parentDir) &&
          fs.readdirSync(parentDir).length === 0
        ) {
          fs.rmdirSync(parentDir);
        }
      }
      return { result: 'ok' };
    } catch (error) {
      console.error('Error deleting local file:', error);
      return { result: 'error', error };
    }
  }

  /**
   * Sanitize a name for use as a folder name.
   */
  static sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
