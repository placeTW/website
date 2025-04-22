import { Pixel } from "../../types/art-tool";

export interface ViewportPixel extends Pixel {
  designId: number;
}

export interface ViewportHandle {
  centerOnDesign: (x: number, y: number, width: number, height: number) => void;
  centerOnCanvas: () => void;
}