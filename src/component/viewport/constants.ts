import { createCheckerboardPattern } from "./utils/create-checkerboard-pattern";

export const GRID_SIZE = 40;
export const CLEAR_ON_DESIGN_PATTERN = createCheckerboardPattern(
  "#eee",
  "#fff",
);
export const CLEAR_ON_MAIN_PATTERN = createCheckerboardPattern(
  "#fc7e7e",
  "#fff",
);

// Reserved colors for clear pixels
export const CLEAR_ON_DESIGN = "ClearOnDesign";
export const CLEAR_ON_MAIN = "ClearOnMain";
