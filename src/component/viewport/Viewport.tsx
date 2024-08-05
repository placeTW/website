import Konva from "konva";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Layer, Rect, Stage, Image as KonvaImage } from "react-konva";
import { Pixel } from "../../types/art-tool";
import { mouseHandlers, touchHandlers, wheelHandler } from "./handlers";
import { useImage } from "./hooks";

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
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number } | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const coordinatesRef = useRef<HTMLDivElement>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [backgroundImage] = useImage("/images/background.png");
  const [clearOnMainImage] = useImage("/images/ClearOnMain.png");
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

  const handleDragEnd = () => {
    calculateVisibleTiles();
  };

  const handleZoom = () => {
    if (stageRef.current) {
      let scale = stageRef.current.scaleX(); // Assuming uniform scaling (scaleX = scaleY)

      // Cap the zoom level
      const minZoomLevel = 1/128;
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
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        cursor: "grab",
        overflow: "hidden",
        backgroundColor: "#f0f0f0"
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
          {/* Render grey background if zoom level is low */}
          {zoomLevel <= 0.125 && (
            <Rect
              x={-stageRef.current!.x() / zoomLevel - (dimensions.width * 2.5) / zoomLevel}
              y={-stageRef.current!.y() / zoomLevel - (dimensions.height * 2.5) / zoomLevel}
              width={(dimensions.width * 5) / zoomLevel}
              height={(dimensions.height * 5) / zoomLevel}
              fill="#f5f5f5" // A lighter grey shade, halfway between #eeeeee and white
            />
          )}

          {/* Render background tiles */}
          {zoomLevel > 0.125
            ? visibleTiles.map((tile) => (
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
            : null}

          {/* Render ClearOnMain image based on layer visibility */}
          {pixels.map((pixel) => {
            if (pixel.color === "ClearOnMain" && clearOnMainImage) {
              return (
                <KonvaImage
                  key={`${pixel.x}-${pixel.y}-${pixel.canvas}`}
                  image={clearOnMainImage}
                  x={pixel.x * gridSize}
                  y={pixel.y * gridSize}
                  width={clearOnMainImage.width}
                  height={clearOnMainImage.height}
                  perfectDrawEnabled={false}
                  imageSmoothingEnabled={false}
                  visible={layerOrder.includes(pixel.canvas)}
                />
              );
            }
            return null;
          })}
        </Layer>

        {/* Render the pixel grid */}
        {layerOrder.map((layer) => (
          <Layer key={layer}>
            {pixels
              .filter((pixel) => pixel.canvas === layer)
              .map((pixel) => (
                <Rect
                  key={`${pixel.x}-${pixel.y}-${pixel.canvas}`}
                  x={pixel.x * gridSize}
                  y={pixel.y * gridSize}
                  width={gridSize}
                  height={gridSize}
                  fill={pixel.color !== "ClearOnMain" ? pixel.color : undefined}
                  strokeWidth={0}
                />
              ))}
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