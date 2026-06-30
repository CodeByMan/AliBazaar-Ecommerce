import { BadRequestException, Logger } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname, join, normalize, sep } from 'path';
import { mkdirSync } from 'fs';
import { unlink } from 'fs/promises';

const logger = new Logger('ImageUpload');
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const protectedDefaults = new Set([
  'defaults/user-avatar.svg',
  'defaults/category-placeholder.svg',
]);

export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

export const createImageStorage = (folder: string, fallbackName: string) =>
  diskStorage({
    destination: (_request, _file, callback) => {
      const destination = join(process.cwd(), 'uploads', folder);
      mkdirSync(destination, { recursive: true });
      callback(null, destination);
    },
    filename: (_request, file, callback) => {
      const extension = extname(file.originalname).toLowerCase();
      const baseName =
        file.originalname
          .slice(0, Math.max(1, file.originalname.length - extension.length))
          .replace(/[^a-zA-Z0-9_-]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 70) || fallbackName;
      callback(
        null,
        `${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${baseName}${extension}`,
      );
    },
  });

export const imageFileFilter =
  (label: string) =>
  (
    _request: Express.Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowed = allowedMimeTypes.has(file.mimetype);
    callback(
      allowed
        ? null
        : new BadRequestException(`${label} must be JPEG, PNG, or WebP`),
      allowed,
    );
  };

export const storedImagePath = (folder: string, file: Express.Multer.File) =>
  `${folder}/${file.filename}`;

const safeRelativePath = (value: string) => {
  const cleaned = value
    .replace(/\\/g, '/')
    .replace(/^\/?uploads\//i, '')
    .replace(/^\/+/, '');
  if (!cleaned || cleaned.includes('..') || /^https?:\/\//i.test(cleaned)) {
    return null;
  }
  const normalizedPath = normalize(cleaned).split(sep).join('/');
  return normalizedPath.startsWith('../') ? null : normalizedPath;
};

export const removeStoredImage = async (value?: string | null) => {
  if (!value) return;
  const relativePath = safeRelativePath(value);
  if (!relativePath || protectedDefaults.has(relativePath)) return;

  try {
    await unlink(join(process.cwd(), 'uploads', relativePath));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.warn(
        `Unable to remove uploaded image ${relativePath}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
};

export const removeUploadedFiles = async (
  files: Array<Express.Multer.File | undefined>,
) => {
  await Promise.all(
    files
      .filter((file): file is Express.Multer.File => Boolean(file))
      .map(async (file) => {
        try {
          await unlink(file.path);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            logger.warn(
              `Unable to remove rejected upload ${file.path}: ${error instanceof Error ? error.message : 'unknown error'}`,
            );
          }
        }
      }),
  );
};
