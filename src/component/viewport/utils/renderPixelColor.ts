import { CLEAR_ON_MAIN_PATTERN, CLEAR_ON_DESIGN, CLEAR_ON_MAIN } from "../constants";

export const renderPixelColor = (color: string): string | HTMLImageElement | null => {
  if (color === CLEAR_ON_DESIGN) {
    return null; // Return null for cleared pixels to render the background
  } else if (color === CLEAR_ON_MAIN) {
    return CLEAR_ON_MAIN_PATTERN;
  }
  return color;
};