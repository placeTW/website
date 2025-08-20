import { Pixel } from "../types/art-tool";

export const getTopLeftCoords = (pixels: Pixel[]): { x: number; y: number } => {
  // Handle empty array to avoid errors
  if (pixels.length === 0) {
    return { x: 0, y: 0 };
  }
  
  // Use a more efficient single-pass approach instead of reduce
  let minX = pixels[0].x;
  let minY = pixels[0].y;
  
  for (let i = 1; i < pixels.length; i++) {
    if (pixels[i].x < minX) minX = pixels[i].x;
    if (pixels[i].y < minY) minY = pixels[i].y;
  }
  
  return { x: minX, y: minY };
};

export const offsetPixels = (
  pixels: Pixel[],
  offset: { x: number; y: number },
): Pixel[] => {
  // If there's no actual offset, return the original array to avoid unnecessary copying
  if (offset.x === 0 && offset.y === 0) {
    return pixels;
  }
  
  // Use a more efficient approach for large arrays
  const result = new Array(pixels.length);
  
  for (let i = 0; i < pixels.length; i++) {
    const pixel = pixels[i];
    // Create a new object while preserving all properties
    result[i] = {
      ...pixel,
      x: pixel.x - offset.x,
      y: pixel.y - offset.y,
    };
  }
  
  return result;
};

export const getDimensions = (pixels: Pixel[]): { width: number; height: number } => {
  // Handle empty array to avoid errors
  if (pixels.length === 0) {
    return { width: 0, height: 0 };
  }
  
  // Use a more efficient single-pass approach that combines min/max calculations
  let minX = pixels[0].x;
  let maxX = pixels[0].x;
  let minY = pixels[0].y;
  let maxY = pixels[0].y;
  
  for (let i = 1; i < pixels.length; i++) {
    const pixel = pixels[i];
    if (pixel.x < minX) minX = pixel.x;
    if (pixel.x > maxX) maxX = pixel.x;
    if (pixel.y < minY) minY = pixel.y;
    if (pixel.y > maxY) maxY = pixel.y;
  }
  
  // Calculate width and height from min/max values
  return {
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}