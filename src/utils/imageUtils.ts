import { Pixel } from "../types/art-tool";

const SCALE_FACTOR = 10 as const;
const THUMBNAIL_MAX_SIZE = 128 as const;

type Bounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

const getBounds = (pixels: Pixel[]): Bounds => {
  // Skip extra iterations and array creations by calculating min/max in a single pass
  if (pixels.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }
  
  // Initialize with the first pixel's values
  let minX = pixels[0].x;
  let maxX = pixels[0].x;
  let minY = pixels[0].y;
  let maxY = pixels[0].y;
  
  // Find min/max in a single pass
  for (let i = 1; i < pixels.length; i++) {
    const pixel = pixels[i];
    if (pixel.x < minX) minX = pixel.x;
    if (pixel.x > maxX) maxX = pixel.x;
    if (pixel.y < minY) minY = pixel.y;
    if (pixel.y > maxY) maxY = pixel.y;
  }
  
  return { minX, maxX, minY, maxY };
};

const createScaledCanvas = (
  pixels: Pixel[],
  bounds: Bounds,
): HTMLCanvasElement => {
  const { minX, maxX, minY, maxY } = bounds;
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  const canvas = document.createElement("canvas");
  canvas.width = width * SCALE_FACTOR;
  canvas.height = height * SCALE_FACTOR;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context");

  pixels.forEach(({ x, y, color }) => {
    const scaledX = (x - minX) * SCALE_FACTOR;
    const scaledY = (y - minY) * SCALE_FACTOR;

    ctx.fillStyle = color;
    ctx.fillRect(scaledX, scaledY, SCALE_FACTOR, SCALE_FACTOR);
  });

  return canvas;
};

const getThumbnailDimensions = (
  width: number,
  height: number,
): { thumbnailWidth: number; thumbnailHeight: number } => {
  if (width > height) {
    return {
      thumbnailWidth: THUMBNAIL_MAX_SIZE,
      thumbnailHeight: (height / width) * THUMBNAIL_MAX_SIZE,
    };
  } else {
    return {
      thumbnailHeight: THUMBNAIL_MAX_SIZE,
      thumbnailWidth: (width / height) * THUMBNAIL_MAX_SIZE,
    };
  }
};

export const createThumbnail = async (pixels: Pixel[]): Promise<Blob> => {
  // Early return for empty pixels to avoid unnecessary processing
  if (pixels.length === 0) {
    // Create a minimal 1x1 transparent image
    const emptyCanvas = document.createElement("canvas");
    emptyCanvas.width = 1;
    emptyCanvas.height = 1;
    return new Promise((resolve, reject) => {
      emptyCanvas.toBlob(
        (blob) => {
          blob
            ? resolve(blob)
            : reject(new Error("Failed to create empty thumbnail blob"));
        },
        "image/png"
      );
    });
  }
  
  // Skip redundant calculations by getting bounds and dimensions in one pass
  const bounds = getBounds(pixels);
  
  // Calculate dimensions once - these will be used multiple times
  const width = bounds.maxX - bounds.minX + 1;
  const height = bounds.maxY - bounds.minY + 1;
  
  // Skip creating scaled canvas for very small designs (1 or 2 pixels)
  let scaledCanvas: HTMLCanvasElement;
  if (width <= 2 && height <= 2) {
    // For tiny designs, create the final thumbnail directly
    const { thumbnailWidth, thumbnailHeight } = getThumbnailDimensions(width, height);
    
    scaledCanvas = document.createElement("canvas");
    scaledCanvas.width = thumbnailWidth;
    scaledCanvas.height = thumbnailHeight;
    
    const ctx = scaledCanvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");
    
    // Draw directly at thumbnail size
    const pixelSize = Math.max(thumbnailWidth / width, thumbnailHeight / height);
    pixels.forEach(({ x, y, color }) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        (x - bounds.minX) * pixelSize, 
        (y - bounds.minY) * pixelSize, 
        pixelSize, 
        pixelSize
      );
    });
    
    // Return directly without a second canvas creation
    return new Promise((resolve, reject) => {
      scaledCanvas.toBlob((blob) => {
        blob
          ? resolve(blob)
          : reject(new Error("Failed to create thumbnail blob"));
      }, "image/png");
    });
  } else {
    // For larger designs, use the two-step process
    scaledCanvas = createScaledCanvas(pixels, bounds);
    
    const { thumbnailWidth, thumbnailHeight } = getThumbnailDimensions(width, height);
    
    const thumbnailCanvas = document.createElement("canvas");
    thumbnailCanvas.width = thumbnailWidth;
    thumbnailCanvas.height = thumbnailHeight;
    
    const thumbnailCtx = thumbnailCanvas.getContext("2d");
    if (!thumbnailCtx) throw new Error("Failed to get 2D context for thumbnail");
    
    thumbnailCtx.imageSmoothingEnabled = false;
    thumbnailCtx.drawImage(
      scaledCanvas,
      0,
      0,
      scaledCanvas.width,
      scaledCanvas.height,
      0,
      0,
      thumbnailCanvas.width,
      thumbnailCanvas.height,
    );
    
    return new Promise((resolve, reject) => {
      thumbnailCanvas.toBlob((blob) => {
        blob
          ? resolve(blob)
          : reject(new Error("Failed to create thumbnail blob"));
      }, "image/png");
    });
  }
};
