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
  art_tool_users: {
    handle: string;
    rank: string;
  };
  rank_name: string; // Ensure this property is included
  liked_by: string[];
  pixels: Pixel[];
  x: number;
  y: number;
  canvas: number;
  art_tool_canvases: {
    canvas_name: string;
  } | null;
  status: DesignStatus;
}

export interface Pixel {
  x: number;
  y: number;
  color: string;
  designId: number; // Add this line
}


export interface Canvas {
  id: number;
  canvas_name: string;
}

export interface Color {
  Color: string;
  color_sort: number | null; // Allow color_sort to be null
  color_name: string;
}


export interface AlertState {
  alert_id: number;   // Unique identifier for each alert
  alert_name: string; // Name of the alert level
  message: string;    // Description of the alert level
  Active: boolean;    // Indicates whether this alert level is active
  canvas_id: number | null; // ID of the associated canvas (nullable)
}
