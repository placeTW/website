import { Pixel } from "../types/art-tool"; // Adjust the import path as needed

export const createThumbnail = async (
  allPixels: Omit<Pixel, "id">[],
  colors: { Color: string }[]
) => {
  // Find the bounding box around all the pixels (existing + new)
  const minX = Math.min(...allPixels.map((p) => p.x));
  const maxX = Math.max(...allPixels.map((p) => p.x));
  const minY = Math.min(...allPixels.map((p) => p.y));
  const maxY = Math.max(...allPixels.map((p) => p.y));

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  // Create a canvas with the dimensions of the bounding box
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to create canvas context");
  }

  // Fill the canvas with the pixel colors
  allPixels.forEach((pixel) => {
    const color = colors.find((c) => c.Color === pixel.color)?.Color || "#000";
    ctx.fillStyle = color;
    ctx.fillRect(pixel.x - minX, pixel.y - minY, 1, 1);
  });

  // Convert the canvas to a Blob (PNG format)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to create blob from canvas"));
      }
    }, "image/png");
  });
};
