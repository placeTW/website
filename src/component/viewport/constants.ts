import { createCheckerboardPattern } from "./utils/createCheckerboardPattern";

export const GRID_SIZE = 10;
export const CLEAR_ON_DESIGN_PATTERN = createCheckerboardPattern(
  "#eee",
  "#fff",
  GRID_SIZE
);
export const CLEAR_ON_MAIN_PATTERN = createCheckerboardPattern(
  "#fc7e7e",
  "#fff",
  GRID_SIZE / 2
);