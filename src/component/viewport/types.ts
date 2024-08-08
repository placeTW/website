export interface ViewportProps {
  designId: string | null;
  pixels: ViewportPixel[];
  isEditing?: boolean;
  onPixelPaint?: (x: number, y: number) => void;
  layerOrder: string[];
}

export interface ViewportPixel {
  x: number;
  y: number;
  color: string;
  designId: number;
}