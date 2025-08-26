// src/utils/png-export.ts

import { Design } from "../types/art-tool";
import { CLEAR_ON_DESIGN } from "../component/viewport/constants";

interface ExportPixel {
  x: number;
  y: number;
  color: string;
}

interface ExportOptions {
  filename?: string;
  download?: boolean;
}

/**
 * Utility functions for PNG export
 */
const getTopLeftCoords = (pixels: ExportPixel[]) => {
  const minX = Math.min(...pixels.map((pixel) => pixel.x));
  const minY = Math.min(...pixels.map((pixel) => pixel.y));
  return { x: minX, y: minY };
};

const offsetPixels = (
  pixels: ExportPixel[],
  offset: { x: number; y: number }
) => {
  return pixels.map((pixel) => ({
    x: pixel.x - offset.x,
    y: pixel.y - offset.y,
    color: pixel.color,
  }));
};

/**
 * Export a single design as PNG
 */
export const exportDesignAsPNG = async (
  design: Design,
  options: ExportOptions = {}
): Promise<Blob> => {
  const { filename, download = false } = options;

  // Get design pixels and offset them by design position
  let pixels: ExportPixel[] = design.pixels.map((pixel) => ({
    x: pixel.x + design.x,
    y: pixel.y + design.y,
    color: pixel.color,
  }));

  // Remove any pixels that are clear
  pixels = pixels.filter((pixel) => pixel.color !== CLEAR_ON_DESIGN);

  if (pixels.length === 0) {
    throw new Error("No pixels to export");
  }

  // Get the top-left coordinates and offset pixels to start from (0,0)
  const topLeftCoords = getTopLeftCoords(pixels);
  const pixelsToExport = offsetPixels(pixels, topLeftCoords);

  // Get the width and height of the cropped area
  const maxX = Math.max(...pixelsToExport.map((pixel) => pixel.x));
  const maxY = Math.max(...pixelsToExport.map((pixel) => pixel.y));
  const width = maxX + 1;
  const height = maxY + 1;

  // Create a canvas and draw the pixels
  const canvasElement = document.createElement("canvas");
  canvasElement.width = width;
  canvasElement.height = height;
  const ctx = canvasElement.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Fill the canvas with transparent pixels
  ctx.clearRect(0, 0, width, height);

  // Draw each pixel
  pixelsToExport.forEach((pixel) => {
    ctx.fillStyle = pixel.color;
    ctx.fillRect(pixel.x, pixel.y, 1, 1);
  });

  // Convert canvas to Blob
  const blob: Blob = await new Promise((resolve, reject) => {
    canvasElement.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Canvas is empty"));
      }
    }, "image/png");
  });

  // Download if requested
  if (download) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `${design.design_name || "design"}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return blob;
};

/**
 * Export multiple designs (canvas) as PNG
 */
export const exportCanvasAsPNG = async (
  designs: Design[],
  layerOrder: number[],
  canvasName: string,
  options: ExportOptions = {}
): Promise<Blob> => {
  const { filename, download = false } = options;

  if (designs.length === 0) {
    throw new Error("No designs found on canvas");
  }

  // Order the designs by the canvas layer order
  const designsMap = new Map(designs.map((obj) => [obj.id, obj]));
  const orderedDesigns = layerOrder
    .map((id) => designsMap.get(id))
    .filter((design) => design !== undefined);

  // Add any designs not in layer order to the end
  designs.forEach((design) => {
    if (!orderedDesigns.includes(design)) {
      orderedDesigns.push(design);
    }
  });

  // Combine all designs' pixels into one array, respecting layer order
  let combinedPixels: ExportPixel[] = [];
  const pixelPositionMap = new Map<string, boolean>();

  // Process designs in layer order (top to bottom)
  orderedDesigns.forEach((design) => {
    if (!design) return;

    // Offset the design's pixels by its x and y coordinates
    const offsettedPixels = design.pixels.map((pixel) => ({
      x: pixel.x + design.x,
      y: pixel.y + design.y,
      color: pixel.color,
    }));

    // Only add pixels that haven't been covered by a higher layer
    offsettedPixels.forEach((pixel) => {
      const key = `${pixel.x},${pixel.y}`;
      if (!pixelPositionMap.has(key)) {
        pixelPositionMap.set(key, true);
        combinedPixels.push(pixel);
      }
    });
  });

  // Remove any pixels that are clear
  combinedPixels = combinedPixels.filter(
    (pixel) => pixel.color !== CLEAR_ON_DESIGN
  );

  if (combinedPixels.length === 0) {
    throw new Error("No pixels to export");
  }

  // Get the top-left coordinates and offset pixels to start from (0,0)
  const topLeftCoords = getTopLeftCoords(combinedPixels);
  const pixelsToExport = offsetPixels(combinedPixels, topLeftCoords);

  // Get the width and height of the cropped area
  const maxX = Math.max(...pixelsToExport.map((pixel) => pixel.x));
  const maxY = Math.max(...pixelsToExport.map((pixel) => pixel.y));
  const width = maxX + 1;
  const height = maxY + 1;

  // Create a canvas and draw the pixels
  const canvasElement = document.createElement("canvas");
  canvasElement.width = width;
  canvasElement.height = height;
  const ctx = canvasElement.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Fill the canvas with transparent pixels
  ctx.clearRect(0, 0, width, height);

  // Draw each pixel
  pixelsToExport.forEach((pixel) => {
    ctx.fillStyle = pixel.color;
    ctx.fillRect(pixel.x, pixel.y, 1, 1);
  });

  // Convert canvas to Blob
  const blob: Blob = await new Promise((resolve, reject) => {
    canvasElement.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Canvas is empty"));
      }
    }, "image/png");
  });

  // Download if requested
  if (download) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = 
      filename || 
      `${canvasName}-export-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return blob;
};