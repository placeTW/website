import { createCheckerboardPattern } from "./utils/create-checkerboard-pattern";

export const GRID_SIZE = 40;
export const CLEAR_ON_DESIGN_PATTERN = createCheckerboardPattern(
  "#eee",
  "#fff",
);

// Reserved colors for clear pixels
export const CLEAR_ON_DESIGN = "ClearOnDesign";
