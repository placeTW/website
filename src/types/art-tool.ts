// src/types/art-tool.ts

export enum DesignStatus {
  DRAFT,
  SUBMITTED,
  CURRENT,
  ARCHIVED,
}

export interface Design {
  id: number;
  design_name: string;
  design_thumbnail: string;
  created_by: string;
  rank_name: string;
  user_handle: string;
  liked_by: string[];
  pixels: Pixel[];
  x: number;
  y: number;
  canvas?: number;
  canvas_name: string;
  status: DesignStatus;
}

export interface Pixel {
  x: number;
  y: number;
  color: string;
  designId: number;
}


export interface Canvas {
  id: number;
  canvas_name: string;
  layer_order: number[]
}

export interface Color {
  Color: string;
  color_sort: number | null;
  color_name: string;
}


export interface AlertState {
  alert_id: number;   // Unique identifier for each alert
  alert_name: string; // Name of the alert level
  message: string;    // Description of the alert level
  Active: boolean;    // Indicates whether this alert level is active
  canvas_id: number | null; // ID of the associated canvas (nullable)
}
