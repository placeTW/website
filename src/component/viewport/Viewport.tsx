import Konva from "konva";
import React, { useEffect, useRef, useState } from "react";
import { Layer, Line, Rect, Stage } from "react-konva";
import { Pixel } from "../../types/art-tool";
import { mouseHandlers, touchHandlers, wheelHandler } from "./handlers";
import { createCheckerboardPattern } from "./utils/createCheckerboardPattern";

interface ViewportProps {
  designId: string | null;
  pixels: Pixel[];
  isEditing?: boolean;
  onPixelPaint?: (x: number, y: number) => void;
  layerOrder: string[];
}

const Viewport: React.FC<ViewportProps> = ({
  designId,
  pixels,
  isEditing,
  onPixelPaint,
  layerOrder,
}) => {
  const [hoveredPixel, setHoveredPixel] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const gridSize = 10;
  const coordinatesRef = useRef<HTMLDivElement>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const clearOnDesignPattern = createCheckerboardPattern(
    "#eee",
    "#fff",
    gridSize,
  );
  const clearOnMainPattern = createCheckerboardPattern(
    "#fc7e7e",
    "#fff",
    gridSize / 2,
  );

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
    if (designId) {
      console.log(`Currently editing design with ID: ${designId}`);
    }
  }, [designId]);

  const drawGrid = (width: number, height: number) => {
    const lines = [];
    for (let i = 0; i < width / gridSize; i++) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i * gridSize, 0, i * gridSize, height]}
          stroke="#ddd"
          strokeWidth={0.5}
        />,
      );
    }
    for (let j = 0; j < height / gridSize; j++) {
      lines.push(
        <Line
          key={`h-${j}`}
          points={[0, j * gridSize, width, j * gridSize]}
          stroke="#ddd"
          strokeWidth={0.5}
        />,
      );
    }
    return lines;
  };

  const renderPixelColor = (
    color: string,
  ): string | HTMLImageElement | null => {
    if (color === "ClearOnDesign") {
      return null;
    } else if (color === "ClearOnMain") {
      return clearOnMainPattern;
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
      // Apply touch handlers
      {...touchHandlers(onPixelPaint, isEditing)}
    >
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        ref={stageRef}
        onWheel={wheelHandler}
        // Apply mouse handlers
        {...mouseHandlers(onPixelPaint, isEditing, stageRef, setHoveredPixel, coordinatesRef)}
        draggable={!isEditing}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={dimensions.width}
            height={dimensions.height}
            fillPatternImage={clearOnDesignPattern}
            fillPatternScale={{ x: 0.5, y: 0.5 }}
          />
          {drawGrid(dimensions.width, dimensions.height)}
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
                    fill={
                      typeof pixelColor === "string" ? pixelColor : undefined
                    }
                    fillPatternImage={
                      typeof pixelColor === "object" ? pixelColor : undefined
                    }
                    fillPatternScale={
                      pixel.color === "ClearOnMain"
                        ? { x: 1, y: 1 }
                        : { x: 1, y: 1 }
                    }
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
