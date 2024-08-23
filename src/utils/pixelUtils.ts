import { Pixel } from "../types/art-tool";

export const getTopLeftCoords = (pixels: Pixel[]): { x: number; y: number } => {
  return pixels.reduce(
    (acc, curr) => ({
      x: Math.min(acc.x, curr.x),
      y: Math.min(acc.y, curr.y),
    }),
    { x: Infinity, y: Infinity },
  );
};

export const offsetPixels = (
  pixels: Pixel[],
  offset: { x: number; y: number },
): Pixel[] => {
  return pixels.map((pixel) => ({
    ...pixel,
    x: pixel.x - offset.x,
    y: pixel.y - offset.y,
  }));
};
