import { Pixel } from "../types/art-tool";

export const getTopLeftCoords = (pixels: Pixel[]) => {
  return pixels.reduce(
    (acc, curr) => {
      if (curr.x < acc.x || (curr.x === acc.x && curr.y < acc.y)) {
        return curr;
      }
      return acc;
    },
    { x: Infinity, y: Infinity },
  ); // Provide initial value
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
