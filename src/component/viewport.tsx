import React, { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Rect, Line } from 'react-konva';
import Konva from 'konva'; // Import Konva for types
import { supabase } from '../api/supabase';

interface Pixel {
  id: number;
  x: number;
  y: number;
  color: string;
  canvas: string;
}

const Viewport: React.FC = () => {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [hoveredPixel, setHoveredPixel] = useState<{ x: number; y: number } | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const gridSize = 10; // Size of each grid cell in pixels
  const coordinatesRef = useRef<HTMLDivElement>(null);
  const checkerPatternRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const fetchPixels = async () => {
      const { data, error } = await supabase
        .from('art_tool_pixels')
        .select('*')
        .eq('canvas', 'main'); // Filter for 'main' canvas
      if (error) {
        console.error('Error fetching pixel data:', error);
      } else {
        console.log('Fetched pixels:', data);
        setPixels(data as Pixel[]);
      }
    };

    fetchPixels();

    const pixelSubscription = supabase
      .channel('art_tool_pixels')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'art_tool_pixels' }, (payload) => {
        console.log('Payload received:', payload);
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          console.log('Insert or Update event:', payload.new);
          if (payload.new.canvas === 'main') {
            setPixels((prevPixels) => [
              ...prevPixels.filter(
                (pixel) => !(pixel.x === payload.new.x && pixel.y === payload.new.y)
              ),
              payload.new,
            ]);
          } else {
            setPixels((prevPixels) =>
              prevPixels.filter(
                (pixel) => !(pixel.x === payload.new.x && pixel.y === payload.new.y)
              )
            );
          }
        } else if (payload.eventType === 'DELETE') {
          console.log('Delete event:', payload.old);
          setPixels((prevPixels) =>
            prevPixels.filter(
              (pixel) => !(pixel.x === payload.old.x && pixel.y === payload.old.y)
            )
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(pixelSubscription);
    };
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

  const createCheckerboardPattern = () => {
    const size = gridSize;
    const canvas = document.createElement('canvas');
    canvas.width = size * 2;
    canvas.height = size * 2;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#eee';
      ctx.fillRect(0, 0, size, size);
      ctx.fillRect(size, size, size, size);

      ctx.fillStyle = '#fff';
      ctx.fillRect(size, 0, size, size);
      ctx.fillRect(0, size, size, size);
    }

    return canvas;
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
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
    <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
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
            width={window.innerWidth}
            height={window.innerHeight}
            fillPatternImage={checkerPatternRef.current as unknown as HTMLImageElement}
            fillPatternScale={{ x: 0.5, y: 0.5 }}
          />
          {drawGrid(window.innerWidth, window.innerHeight)}
        </Layer>
        <Layer>
          {pixels.map((pixel) => (
            <Rect
              key={`${pixel.x}-${pixel.y}`}
              x={pixel.x * gridSize}
              y={pixel.y * gridSize}
              width={gridSize}
              height={gridSize}
              fill={pixel.color} // Use the color from the table
              strokeWidth={0} // Remove the black stroke
            />
          ))}
        </Layer>
      </Stage>
      {hoveredPixel && (
        <div
          ref={coordinatesRef}
          style={{
            position: 'absolute',
            backgroundColor: 'white',
            padding: '2px 4px',
            border: '1px solid black',
            borderRadius: '3px',
            pointerEvents: 'none',
          }}
        >
          {hoveredPixel.x}, {hoveredPixel.y}
        </div>
      )}
    </div>
  );
};

export default Viewport;
