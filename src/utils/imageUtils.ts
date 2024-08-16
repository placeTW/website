import { Pixel } from "../types/art-tool"; // Adjust the import path as needed

export const createThumbnail = async (
  pixels: Pixel[]
): Promise<Blob> => {
  const canvas = document.createElement("canvas");

  // Determine the bounding box of the pixels to minimize the thumbnail size
  const xCoordinates = pixels.map((pixel) => pixel.x);
  const yCoordinates = pixels.map((pixel) => pixel.y);

  const minX = Math.min(...xCoordinates);
  const maxX = Math.max(...xCoordinates);
  const minY = Math.min(...yCoordinates);
  const maxY = Math.max(...yCoordinates);

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  // Scale factor to increase resolution
  const scaleFactor = 10; // Scale up by a factor of 10
  canvas.width = width * scaleFactor;
  canvas.height = height * scaleFactor;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context");

  // Fill the canvas with the pixels
  pixels.forEach(({ x, y, color }) => {
    const scaledX = (x - minX) * scaleFactor;
    const scaledY = (y - minY) * scaleFactor;

    ctx.fillStyle = color;
    ctx.fillRect(scaledX, scaledY, scaleFactor, scaleFactor);
  });

  // Determine the aspect ratio and fit within the thumbnail size
  const thumbnailMaxSize = 128; // Max size for the longer dimension of the thumbnail

  let thumbnailWidth: number;
  let thumbnailHeight: number;

  if (width > height) {
    thumbnailWidth = thumbnailMaxSize;
    thumbnailHeight = (height / width) * thumbnailMaxSize;
  } else {
    thumbnailHeight = thumbnailMaxSize;
    thumbnailWidth = (width / height) * thumbnailMaxSize;
  }

  // Create the thumbnail canvas
  const thumbnailCanvas = document.createElement("canvas");
  thumbnailCanvas.width = thumbnailWidth;
  thumbnailCanvas.height = thumbnailHeight;

  const thumbnailCtx = thumbnailCanvas.getContext("2d");
  if (!thumbnailCtx) throw new Error("Failed to get 2D context for thumbnail");

  // Use nearest-neighbor scaling for a sharp result
  thumbnailCtx.imageSmoothingEnabled = false;
  thumbnailCtx.drawImage(
    canvas,
    0,
    0,
    canvas.width,
    canvas.height,
    0,
    0,
    thumbnailCanvas.width,
    thumbnailCanvas.height
  );

  // Convert the thumbnail to a Blob
  return new Promise((resolve, reject) => {
    thumbnailCanvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to create thumbnail blob"));
      }
    }, "image/png");
  });
};
