import Konva from "konva";
import React, { useEffect, useRef, useState } from "react";
import { Layer, Line, Rect, Stage } from "react-konva";

interface Pixel {
  id: number;
  x: number;
  y: number;
  color: string;
  canvas: string;
}

interface ViewportProps {
  pixels: Pixel[];
}

const Viewport: React.FC<ViewportProps> = ({ pixels }) => {
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number } | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const gridSize = 10; // Size of each grid cell in pixels
  const coordinatesRef = useRef<HTMLDivElement>(null);
  const checkerPatternRef = useRef<HTMLCanvasElement | null>(null);
  const divRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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
    return () => resizeObserver.disconnect(); // clean up
  }, []);

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * 1.1 : oldScale / 1.1;

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    stage.position(newPos);
    stage.batchDraw();
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

  const createCheckerboardPattern = () => {
    const size = gridSize;
    const canvas = document.createElement("canvas");
    canvas.width = size * 2;
    canvas.height = size * 2;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.fillStyle = "#eee";
      ctx.fillRect(0, 0, size, size);
      ctx.fillRect(size, size, size, size);

      ctx.fillStyle = "#fff";
      ctx.fillRect(size, 0, size, size);
      ctx.fillRect(0, size, size, size);
    }

    return canvas;
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
  };

  const handleMouseLeave = () => {
    setHoveredPixel(null);
  };

  useEffect(() => {
    checkerPatternRef.current = createCheckerboardPattern();
  }, []);

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
    >
      <Stage
        width={dimensions.width}
        height={dimensions.height}
        draggable
        ref={stageRef}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={dimensions.width}
            height={dimensions.height}
            fillPatternImage={checkerPatternRef.current as unknown as HTMLImageElement}
            fillPatternScale={{ x: 0.5, y: 0.5 }}
          />
          {drawGrid(dimensions.width, dimensions.height)}
        </Layer>
        <Layer>
          {pixels.map((pixel) => (
            <Rect
              key={`${pixel.x}-${pixel.y}-${pixel.canvas}`} // Ensure unique keys by including canvas name
              x={pixel.x * gridSize}
              y={pixel.y * gridSize}
              width={gridSize}
              height={gridSize}
              fill={pixel.color}
              strokeWidth={0}
            />
          ))}
        </Layer>
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
