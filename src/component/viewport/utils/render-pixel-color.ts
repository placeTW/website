import { CLEAR_ON_DESIGN } from "../constants";

export const renderPixelColor = (
  color: string,
): string | HTMLCanvasElement | null => {
  if (color === CLEAR_ON_DESIGN) {
    return null; // Return null for cleared pixels to render the background
  }
  return color;
};
