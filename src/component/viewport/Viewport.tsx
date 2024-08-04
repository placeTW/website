import Konva from "konva";
import React, { useEffect, useRef, useState, useCallback } from "react";
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

const useImage = (src: string): [HTMLImageElement | undefined] => {
  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);

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
  const [clearOnMainImage] = useImage("/images/ClearOnMain.png"); // Load the ClearOnMain image
  const gridSize = 40; // Each cell pixel in the image is 40x40 image pixels
  const [visibleTiles, setVisibleTiles] = useState<{ x: number; y: number }[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  const backgroundTileSize = 1000; // Assuming each background image is 1000x1000

  const calculateVisibleTiles = useCallback(() => {
    if (!stageRef.current) return;

    const stage = stageRef.current;
    const scale = stage.scaleX(); // Assume uniform scaling (same for X and Y)
    setZoomLevel(scale); // Update zoom level state

    if (scale <= 0.125) {
      // If zoom level is 0.125 or lower, skip tile calculation
      setVisibleTiles([]); // Clear the visible tiles array
      console.log("Zoom level too low, rendering grey background only");
      return;
    }

    const viewWidth = stage.width() / scale;
    const viewHeight = stage.height() / scale;

    // Adjusted to handle scaling and offset correctly
    const offsetX = -stage.x() / scale;
    const offsetY = -stage.y() / scale;

    // Calculate the range of visible tiles
    const minX = Math.floor(offsetX / backgroundTileSize);
    const minY = Math.floor(offsetY / backgroundTileSize);
    const maxX = Math.ceil((offsetX + viewWidth) / backgroundTileSize);
    const maxY = Math.ceil((offsetY + viewHeight) / backgroundTileSize);

    const newVisibleTiles: { x: number; y: number }[] = [];
    for (let x = minX; x < maxX; x++) {
      for (let y = minY; y < maxY; y++) {
        newVisibleTiles.push({ x, y });
      }
    }

    setVisibleTiles(newVisibleTiles);
    console.log("Currently visible tiles:", newVisibleTiles.length);
  }, [backgroundTileSize]);

  useEffect(() => {
    calculateVisibleTiles();
  }, [dimensions, calculateVisibleTiles]);

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
    if (color === "ClearOnDesign") {
      return null; // Handle ClearOnDesign if needed
    } else if (color === "ClearOnMain") {
      return clearOnMainImage || null;
    }
    return color;
  };

  const handleDragEnd = () => {
    calculateVisibleTiles();
  };

  const handleZoom = () => {
    if (stageRef.current) {
      let scale = stageRef.current.scaleX(); // Assuming uniform scaling (scaleX = scaleY)

      // Cap the zoom level
      const minZoomLevel = 0.0078125;
      if (scale < minZoomLevel) {
        scale = minZoomLevel;
        stageRef.current.scale({ x: scale, y: scale });
      }

      console.log("Current zoom level:", scale);
      calculateVisibleTiles();
    }
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
        onWheel={(e) => {
          wheelHandler(e);
          handleZoom();
        }}
        {...mouseHandlers(onPixelPaint, isEditing, stageRef, setHoveredPixel, coordinatesRef)}
        onDragEnd={handleDragEnd}
        draggable={!isEditing}
      >
        <Layer>
          {/* Conditionally render the background tiles or a solid grey rectangle */}
          {zoomLevel > 0.125 ? (
            visibleTiles.map((tile) => (
              <KonvaImage
                key={`${tile.x}-${tile.y}`}
                image={backgroundImage}
                x={tile.x * backgroundTileSize}
                y={tile.y * backgroundTileSize}
                width={backgroundTileSize}
                height={backgroundTileSize}
                perfectDrawEnabled={false}
                imageSmoothingEnabled={false}
              />
            ))
          ) : (
            <Rect
              x={-stageRef.current!.x() / zoomLevel - (dimensions.width * 2.5) / zoomLevel}
              y={-stageRef.current!.y() / zoomLevel - (dimensions.height * 2.5) / zoomLevel}
              width={(dimensions.width * 5) / zoomLevel}
              height={(dimensions.height * 5) / zoomLevel}
              fill="#f5f5f5" // A lighter grey shade, halfway between #eeeeee and white
            />
          )}
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
                    fillPatternImage={typeof pixelColor === "object" ? pixelColor : undefined}
                    fillPatternScale={{ x: 1, y: 1 }}
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
