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
