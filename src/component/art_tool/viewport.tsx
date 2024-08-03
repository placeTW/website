import Konva from "konva";
import React, { useEffect, useRef, useState } from "react";
import { Pixel } from "../../types/art-tool";
import { Layer, Line, Rect, Stage } from "react-konva";

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
  const gridSize = 10;
  const coordinatesRef = useRef<HTMLDivElement>(null);
  const divRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const isPanning = useRef(false);
  const isPainting = useRef(false);
  const lastTouchDistance = useRef(0);
  const initialStagePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialTouchPos = useRef<{ x: number; y: number } | null>(null);
  const touchStartTime = useRef(0); // Track the time when the touch starts

  const createCheckerboardPattern = (color1: string, color2: string, size: number): HTMLImageElement => {
    const canvas = document.createElement("canvas");
    canvas.width = size * 2;
    canvas.height = size * 2;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.fillStyle = color1;
      ctx.fillRect(0, 0, size, size);
      ctx.fillRect(size, size, size, size);

      ctx.fillStyle = color2;
      ctx.fillRect(size, 0, size, size);
      ctx.fillRect(0, size, size, size);
    }

    const image = new Image();
    image.src = canvas.toDataURL();
    return image;
  };

  const clearOnDesignPattern = createCheckerboardPattern("#eee", "#fff", gridSize);
  const clearOnMainPattern = createCheckerboardPattern("#fc7e7e", "#fff", gridSize / 2);

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

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.1;
    const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.position(newPos);
    stage.batchDraw();
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Handle pinch to zoom
    if (e.touches.length === 2) {
      e.preventDefault(); // Prevent default zoom behavior
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      if (lastTouchDistance.current === 0) {
        lastTouchDistance.current = dist;
      } else {
        const scaleBy = dist / lastTouchDistance.current;
        const oldScale = stage.scaleX();
        const newScale = oldScale * scaleBy;

        // Calculate the center point of the pinch
        const center = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };

        const mousePointTo = {
          x: (center.x - stage.x()) / oldScale,
          y: (center.y - stage.y()) / oldScale,
        };

        stage.scale({ x: newScale, y: newScale });

        const newPos = {
          x: center.x - mousePointTo.x * newScale,
          y: center.y - mousePointTo.y * newScale,
        };

        stage.position(newPos);
        stage.batchDraw();

        lastTouchDistance.current = dist; // Update the last distance
      }
    }

    // Handle single touch panning
    if (e.touches.length === 1 && isPanning.current && initialTouchPos.current) {
      const touch = e.touches[0];
      const dx = touch.clientX - initialTouchPos.current.x;
      const dy = touch.clientY - initialTouchPos.current.y;

      stage.position({
        x: initialStagePos.current.x + dx,
        y: initialStagePos.current.y + dy,
      });
      stage.batchDraw();
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage) return;

    touchStartTime.current = Date.now();

    if (e.touches.length === 1) {
      // Single touch - initiate potential painting or panning
      isPanning.current = false;
      initialTouchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      initialStagePos.current = stage.position();
    } else if (e.touches.length === 2) {
      // Multi-touch - initiate pinch to zoom
      lastTouchDistance.current = 0;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const touchDuration = Date.now() - touchStartTime.current;

    // If it's a quick tap and the user hasn't moved far, treat it as a pixel placement
    if (e.changedTouches.length === 1 && touchDuration < 200 && initialTouchPos.current) {
      const touch = e.changedTouches[0];
      const dx = Math.abs(touch.clientX - initialTouchPos.current.x);
      const dy = Math.abs(touch.clientY - initialTouchPos.current.y);

      if (dx < 5 && dy < 5 && isEditing && onPixelPaint) {
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const scale = stage.scaleX();
        const x = Math.floor((pointer.x - stage.x()) / (gridSize * scale));
        const y = Math.floor((pointer.y - stage.y()) / (gridSize * scale));
        onPixelPaint(x, y);
      }
    }

    // Reset panning and pinch state on touch end
    isPanning.current = false;
    lastTouchDistance.current = 0;
    initialTouchPos.current = null;
  };

  const handleMouseMove = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const scale = stage.scaleX();
    const x = Math.floor((pointer.x - stage.x()) / (gridSize * scale));
    const y = Math.floor((pointer.y - stage.y()) / (gridSize * scale));
    setHoveredPixel({ x, y });

    if (coordinatesRef.current) {
      coordinatesRef.current.style.left = `${pointer.x + 10}px`;
      coordinatesRef.current.style.top = `${pointer.y + 10}px`;
    }

    if (isPainting.current && isEditing && onPixelPaint) {
      onPixelPaint(x, y);
    }

    if (isPanning.current && initialTouchPos.current) {
      const dx = pointer.x - initialTouchPos.current.x;
      const dy = pointer.y - initialTouchPos.current.y;

      stage.position({
        x: initialStagePos.current.x + dx,
        y: initialStagePos.current.y + dy,
      });
      stage.batchDraw();
    }
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    if (e.evt.button === 0 && isEditing) {
      // Left-click
      isPainting.current = true;
    } else if (e.evt.button === 2) {
      // Right-click
      isPanning.current = true;
      initialTouchPos.current = stage.getPointerPosition(); // Capture initial mouse position
      initialStagePos.current = stage.position(); // Capture initial stage position
    }
  };

  const handleMouseUp = () => {
    isPainting.current = false;
    isPanning.current = false;
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default context menu from showing
  };

  const drawGrid = (width: number, height: number) => {
    const lines = [];
    for (let i = 0; i < width / gridSize; i++) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i * gridSize, 0, i * gridSize, height]}
          stroke="#ddd"
          strokeWidth={0.5}
        />
      );
    }
    for (let j = 0; j < height / gridSize; j++) {
      lines.push(
        <Line
          key={`h-${j}`}
          points={[0, j * gridSize, width, j * gridSize]}
          stroke="#ddd"
          strokeWidth={0.5}
        />
      );
    }
    return lines;
  };

  const renderPixelColor = (color: string): string | HTMLImageElement | null => {
    if (color === "ClearOnDesign") {
      return null; // Return null for cleared pixels to render the background
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
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        ref={stageRef}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
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
                    fill={typeof pixelColor === "string" ? pixelColor : undefined}
                    fillPatternImage={typeof pixelColor === "object" ? pixelColor : undefined}
                    fillPatternScale={pixel.color === "ClearOnMain" ? { x: 1, y: 1 } : { x: 1, y: 1 }}
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
