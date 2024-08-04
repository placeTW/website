export interface ViewportProps {
  designId: string | null;
  pixels: Pixel[];
  isEditing?: boolean;
  onPixelPaint?: (x: number, y: number) => void;
  layerOrder: string[];
}

export interface Pixel {
  x: number;
  y: number;
  color: string;
  canvas: string;
}