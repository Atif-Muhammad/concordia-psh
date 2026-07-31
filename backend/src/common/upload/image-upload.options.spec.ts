import { BadRequestException } from '@nestjs/common';
import { imageUploadOptions } from './image-upload.options';

function runFileFilter(file: Partial<Express.Multer.File>) {
  return new Promise<{ error: unknown; accepted: boolean }>((resolve) => {
    imageUploadOptions.fileFilter?.({} as any, file as Express.Multer.File, (error, accepted) => {
      resolve({ error, accepted: Boolean(accepted) });
    });
  });
}

describe('imageUploadOptions', () => {
  it('accepts png and jpeg files', async () => {
    await expect(runFileFilter({ mimetype: 'image/png', originalname: 'photo.png' })).resolves.toEqual({
      error: null,
      accepted: true,
    });
    await expect(runFileFilter({ mimetype: 'image/jpeg', originalname: 'photo.jpg' })).resolves.toEqual({
      error: null,
      accepted: true,
    });
  });

  it('rejects non-image upload types', async () => {
    const result = await runFileFilter({ mimetype: 'application/pdf', originalname: 'photo.pdf' });

    expect(result.accepted).toBe(false);
    expect(result.error).toBeInstanceOf(BadRequestException);
  });

  it('rejects image mime types with unsupported extensions', async () => {
    const result = await runFileFilter({ mimetype: 'image/jpeg', originalname: 'photo.gif' });

    expect(result.accepted).toBe(false);
    expect(result.error).toBeInstanceOf(BadRequestException);
  });

  it('sets a 10 MB max file size', () => {
    expect(imageUploadOptions.limits?.fileSize).toBe(10 * 1024 * 1024);
  });
});
