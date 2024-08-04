import Konva from "konva";
import React, { useEffect, useRef, useState } from "react";
import { Layer, Rect, Stage, Image as KonvaImage } from "react-konva";
import { Pixel } from "../../types/art-tool";
import { mouseHandlers, touchHandlers, wheelHandler } from "./handlers";

interface ViewportProps {
  designId: string | null;
  pixels: Pixel[];
  isEditing?: boolean;
  onPixelPaint?: (x: number, y: number) => void;
  layerOrder: string[];
}

const useImage = (src: string): [CanvasImageSource | undefined] => {
  const [image, setImage] = useState<CanvasImageSource | undefined>(undefined);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImage(img);
    };
    img.onerror = () => {
      setImage(undefined);
    };
  }, [src]);

  return [image];
};

const Viewport: React.FC<ViewportProps> = ({
  designId,
  pixels,
  isEditing,
  onPixelPaint,
  layerOrder,
}) => {
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number } | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const coordinatesRef = useRef<HTMLDivElement>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [backgroundImage] = useImage("/images/background.png");
  const gridSize = 40; // Each cell pixel in the image is 40x40 image pixels

  useEffect(() => {
    if (!divRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      });
    });
    resizeObserver.observe(divRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (stageRef.current) {
      const layer = stageRef.current.getLayers()[0];
      const context = layer.getCanvas().getContext();
      context.imageSmoothingEnabled = false;
    }
  }, [backgroundImage]);

  useEffect(() => {
    if (designId) {
      console.log(`Currently editing design with ID: ${designId}`);
    }
  }, [designId]);

  const renderPixelColor = (color: string): string | HTMLImageElement | null => {
    if (color === "ClearOnDesign" || color === "ClearOnMain") {
      return null;
    }
    return color;
  };

  return (
    <div
      className="viewport-container"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
      }}
      ref={divRef}
      {...touchHandlers(onPixelPaint, isEditing)}
    >
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        ref={stageRef}
        onWheel={wheelHandler}
        {...mouseHandlers(onPixelPaint, isEditing, stageRef, setHoveredPixel, coordinatesRef)}
        draggable={!isEditing}
      >
        <Layer>
          <KonvaImage
            image={backgroundImage}
            x={0}
            y={0}
            width={1000} // Width of the background image
            height={1000} // Height of the background image
            perfectDrawEnabled={false}
            imageSmoothingEnabled={false}
          />
        </Layer>
        {layerOrder.map((layer) => (
          <Layer key={layer}>
            {pixels
              .filter((pixel) => pixel.canvas === layer)
              .map((pixel) => {
                const pixelColor = renderPixelColor(pixel.color);
                return pixelColor ? (
                  <Rect
                    key={`${pixel.x}-${pixel.y}-${pixel.canvas}`}
                    x={pixel.x * gridSize}
                    y={pixel.y * gridSize}
                    width={gridSize}
                    height={gridSize}
                    fill={typeof pixelColor === "string" ? pixelColor : undefined}
                    strokeWidth={0}
                  />
                ) : null;
              })}
          </Layer>
        ))}
      </Stage>
      {hoveredPixel && (
        <div
          ref={coordinatesRef}
          style={{
            position: "absolute",
            backgroundColor: "white",
            padding: "2px 4px",
            border: "1px solid black",
            borderRadius: "3px",
            pointerEvents: "none",
          }}
        >
          {hoveredPixel.x}, {hoveredPixel.y}
        </div>
      )}
    </div>
  );
};

export default Viewport;
