import { CLEAR_ON_MAIN_PATTERN } from "../constants";

export const renderPixelColor = (color: string): string | HTMLImageElement | null => {
  if (color === "ClearOnDesign") {
    return null; // Return null for cleared pixels to render the background
  } else if (color === "ClearOnMain") {
    return CLEAR_ON_MAIN_PATTERN;
  }
  return color;
};