// src/types/art-tool.ts

export enum DesignStatus {
  DRAFT,
  SUBMITTED,
  CURRENT,
  ARCHIVED
}

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
  canvas: string;
  canvas_name: string;
  status: DesignStatus;
}

export interface Pixel {
  x: number;
  y: number;
  color: string;
  canvas: string;
}

export interface Canvas {
  id: number;
  canvas_name: string;
}
