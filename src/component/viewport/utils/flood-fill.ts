import { ViewportPixel } from '../types';
import { CLEAR_ON_DESIGN } from '../constants';

export interface FloodFillResult {
  filledPixels: Array<{ x: number; y: number; color: string; designId: number }>;
}

/**
 * Performs flood fill starting from the given coordinates
 * @param startX Starting X coordinate
 * @param startY Starting Y coordinate  
 * @param fillColor The color to fill with
 * @param targetColor The color to replace
 * @param designId The design ID for the pixels
 * @param allPixels All existing pixels in the viewport
 * @param maxFill Maximum number of pixels to fill (safety limit)
 * @returns The pixels that should be filled
 */
export function floodFill(
  startX: number,
  startY: number,
  fillColor: string,
  targetColor: string,
  designId: number,
  allPixels: ViewportPixel[],
  maxFill: number = 1000
): FloodFillResult {
  // Don't fill if target and fill colors are the same
  if (targetColor === fillColor) {
    return { filledPixels: [] };
  }

  // Create a map for quick pixel lookup
  const pixelMap = new Map<string, string>();
  allPixels.forEach(pixel => {
    const key = `${pixel.x}-${pixel.y}`;
    // Only consider pixels from the same design
    if (pixel.designId === designId) {
      pixelMap.set(key, pixel.color);
    }
  });

  // Helper function to get pixel color at coordinates
  const getPixelColor = (x: number, y: number): string => {
    const key = `${x}-${y}`;
    return pixelMap.get(key) || CLEAR_ON_DESIGN;
  };

  const filledPixels: Array<{ x: number; y: number; color: string; designId: number }> = [];
  const visited = new Set<string>();
  const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];

  while (queue.length > 0 && filledPixels.length < maxFill) {
    const { x, y } = queue.shift()!;
    const key = `${x}-${y}`;

    // Skip if already visited
    if (visited.has(key)) {
      continue;
    }

    // Mark as visited
    visited.add(key);

    // Check if current pixel color matches target color
    const currentColor = getPixelColor(x, y);
    if (currentColor !== targetColor) {
      continue;
    }

    // Add this pixel to fill
    filledPixels.push({
      x,
      y,
      color: fillColor,
      designId,
    });

    // Add adjacent pixels to queue (4-connected)
    const adjacent = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 },
    ];

    for (const adj of adjacent) {
      const adjKey = `${adj.x}-${adj.y}`;
      if (!visited.has(adjKey)) {
        queue.push(adj);
      }
    }
  }

  return { filledPixels };
}