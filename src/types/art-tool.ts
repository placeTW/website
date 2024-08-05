// src/types/art-tool.ts

export interface Design {
  id: string;
  design_name: string;
  design_thumbnail: string;
  created_by: string;
  handle: string;
  rank: string;
  rank_name: string; // Ensure this property is included
  liked_by: string[];
  pixels: Pixel[];
  x: number;
  y: number;
}

export interface Pixel {
  x: number;
  y: number;
  color: string;
  canvas: string;
}

export interface Canvas {
  id: string;
  canvas_name: string;
}

export interface CanvasDesign {
  id: string;
  canvas_id: string;
  design_id: string;
  order: number;
  pixels: Pixel[]; // Added: pixels for the combined canvas view
}
