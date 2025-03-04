import sharp from 'sharp';

export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

export interface OptimizedImage {
  original: {
    width: number;
    height: number;
    size: number;
  };
  optimized: {
    width: number;
    height: number;
    size: number;
    url: string;
  };
  compressionRatio: number;
}

const defaultOptions: OptimizationOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 80,
  format: 'webp'
};

export async function optimizeImage(
  file: File,
  options: OptimizationOptions = defaultOptions
): Promise<OptimizedImage> {
  // Create a blob URL for the original image
  const originalUrl = URL.createObjectURL(file);

  // Load the image into a canvas to get dimensions
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = originalUrl;
  });

  // Calculate new dimensions maintaining aspect ratio
  const aspectRatio = img.width / img.height;
  let newWidth = img.width;
  let newHeight = img.height;

  if (options.maxWidth && newWidth > options.maxWidth) {
    newWidth = options.maxWidth;
    newHeight = newWidth / aspectRatio;
  }

  if (options.maxHeight && newHeight > options.maxHeight) {
    newHeight = options.maxHeight;
    newWidth = newHeight * aspectRatio;
  }

  // Create a canvas for resizing
  const canvas = document.createElement('canvas');
  canvas.width = newWidth;
  canvas.height = newHeight;
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(img, 0, 0, newWidth, newHeight);

  // Convert to WebP with quality setting
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (b) => resolve(b!),
      `image/${options.format}`,
      options.quality ? options.quality / 100 : 0.8
    );
  });

  // Create optimized image URL
  const optimizedUrl = URL.createObjectURL(blob);

  const result: OptimizedImage = {
    original: {
      width: img.width,
      height: img.height,
      size: file.size,
    },
    optimized: {
      width: newWidth,
      height: newHeight,
      size: blob.size,
      url: optimizedUrl,
    },
    compressionRatio: ((file.size - blob.size) / file.size) * 100,
  };

  // Clean up original URL
  URL.revokeObjectURL(originalUrl);

  return result;
}

export async function optimizeMultipleImages(
  files: FileList | File[],
  options?: OptimizationOptions,
  onProgress?: (progress: number) => void
): Promise<OptimizedImage[]> {
  const results: OptimizedImage[] = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const result = await optimizeImage(files[i], options);
    results.push(result);
    if (onProgress) {
      onProgress((i + 1) / total * 100);
    }
  }

  return results;
}

// Keep backward compatibility export
export const optimizeImages = optimizeMultipleImages;

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}