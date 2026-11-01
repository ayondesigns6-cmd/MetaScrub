import { detectMetadata, type DetectedMetadata } from './metadataDetector';

export interface ProcessImageOptions {
  outputFormat?: 'auto' | 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number; // 0.1 to 1.0, default 0.95
}

export interface CleanedImageResult {
  id: string;
  originalFileName: string;
  originalSize: number;
  cleanedSize: number;
  dimensions: { width: number; height: number };
  detectedBefore: DetectedMetadata;
  verifiedCleanAfter: boolean;
  mimeType: string;
  cleanedBlob: Blob;
  previewUrl: string;
  cleanedFileName: string;
}

export async function processImageFile(
  file: File,
  options: ProcessImageOptions = {}
): Promise<CleanedImageResult> {
  const { outputFormat = 'auto', quality = 0.95 } = options;

  // Read array buffer to inspect metadata presence before cleaning
  const originalBuffer = await file.arrayBuffer();
  const detectedBefore = detectMetadata(originalBuffer);

  let sourceBlob: Blob = file;
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif');

  if (isHeic) {
    try {
      const heic2anyModule = await import('heic2any');
      const heic2any = heic2anyModule.default || heic2anyModule;
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: Math.min(quality, 0.95),
      });
      sourceBlob = Array.isArray(converted) ? converted[0] : converted;
    } catch (err) {
      console.warn('HEIC conversion failed with heic2any, falling back to direct load', err);
    }
  }

  // Determine export MIME type
  let exportMime = 'image/jpeg';
  if (outputFormat === 'auto') {
    if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
      exportMime = 'image/png';
    } else if (file.type === 'image/webp' || file.name.toLowerCase().endsWith('.webp')) {
      exportMime = 'image/webp';
    } else {
      exportMime = 'image/jpeg';
    }
  } else {
    exportMime = outputFormat;
  }

  // Load image into canvas
  const imgUrl = URL.createObjectURL(sourceBlob);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = (e) => reject(new Error('Failed to decode image data: ' + e));
    el.src = imgUrl;
  });

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  // Draw into offscreen canvas (stripping all original container headers)
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) {
    URL.revokeObjectURL(imgUrl);
    throw new Error('Could not initialize 2D canvas context');
  }

  // Fill white background for JPEGs if source had transparency
  if (exportMime === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(imgUrl);

  // Re-encode pixel data
  const cleanedBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to encode clean canvas blob'));
      },
      exportMime,
      exportMime === 'image/png' ? undefined : quality
    );
  });

  // Verify cleaned blob has zero metadata markers
  const cleanedBuffer = await cleanedBlob.arrayBuffer();
  const cleanedMetadata = detectMetadata(cleanedBuffer);
  const verifiedCleanAfter = cleanedMetadata.details.length === 0;

  // Generate cleaned filename
  const dotIndex = file.name.lastIndexOf('.');
  const baseName = dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
  let targetExt = 'jpg';
  if (exportMime === 'image/png') targetExt = 'png';
  else if (exportMime === 'image/webp') targetExt = 'webp';
  else targetExt = 'jpg';

  const cleanedFileName = `${baseName}_cleaned.${targetExt}`;
  const previewUrl = URL.createObjectURL(cleanedBlob);

  return {
    id: Math.random().toString(36).substring(2, 9),
    originalFileName: file.name,
    originalSize: file.size,
    cleanedSize: cleanedBlob.size,
    dimensions: { width, height },
    detectedBefore,
    verifiedCleanAfter,
    mimeType: exportMime,
    cleanedBlob,
    previewUrl,
    cleanedFileName,
  };
}
