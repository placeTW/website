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
  const xCoordinates = pixels.map((pixel) => pixel.x);
  const yCoordinates = pixels.map((pixel) => pixel.y);

  return {
    minX: Math.min(...xCoordinates),
    maxX: Math.max(...xCoordinates),
    minY: Math.min(...yCoordinates),
    maxY: Math.max(...yCoordinates),
  };
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
  const bounds = getBounds(pixels);
  const scaledCanvas = createScaledCanvas(pixels, bounds);

  const { thumbnailWidth, thumbnailHeight } = getThumbnailDimensions(
    bounds.maxX - bounds.minX + 1,
    bounds.maxY - bounds.minY + 1,
  );

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
};
