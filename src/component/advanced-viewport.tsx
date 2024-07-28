import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import { supabase } from '../api/supabase';

interface Pixel {
  id: number;
  x: number;
  y: number;
  color: string;
  canvas: string;
}

const AdvancedViewport: React.FC = () => {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [scale, setScale] = useState(1);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const stageRef = useRef<Stage>(null);

  useEffect(() => {
    const fetchPixels = async () => {
      const { data, error } = await supabase
        .from('art_tool_pixels')
        .select('*')
        .eq('canvas', 'main');

      if (error) {
        console.error('Error fetching pixels:', error);
        return;
      }

      setPixels(data as Pixel[]);
    };

    fetchPixels();

    const pixelSubscription = supabase
      .channel('art_tool_pixels')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'art_tool_pixels' }, (payload) => {
        const { new: newPixel, old: oldPixel } = payload;
        if (newPixel.canvas === 'main') {
          setPixels((prevPixels) => [...prevPixels, newPixel]);
        } else {
          setPixels((prevPixels) => prevPixels.filter((pixel) => pixel.id !== oldPixel.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(pixelSubscription);
    };
  }, []);

  const handleMouseDown = (e: any) => {
    setIsDrawing(true);
    addOrUpdatePixel(e);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) {
      const pointer = stageRef.current?.getPointerPosition();
      if (pointer) {
        const x = Math.floor(pointer.x / 10);
        const y = Math.floor(pointer.y / 10);
        setCursorPos({ x, y });
      }
      return;
    }
    addOrUpdatePixel(e);
  };

  const addOrUpdatePixel = async (e: any) => {
    const pointer = stageRef.current?.getPointerPosition();
    if (pointer) {
      const x = Math.floor(pointer.x / 10);
      const y = Math.floor(pointer.y / 10);

      const newPixel: Pixel = {
        id: Date.now(),
        x,
        y,
        color: '#FF0000', // Example color, you can change this to a dynamic value
        canvas: 'main',
      };

      const { data, error } = await supabase
        .from('art_tool_pixels')
        .upsert(newPixel, { onConflict: ['x', 'y', 'canvas'] });

      if (error) {
        console.error('Error updating pixel:', error);
        return;
      }

      setPixels((prevPixels) => [...prevPixels.filter((pixel) => !(pixel.x === x && pixel.y === y && pixel.canvas === 'main')), newPixel]);
    }
  };

  return (
    <div className="viewport-container">
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        scaleX={scale}
        scaleY={scale}
        onWheel={(e) => {
          e.evt.preventDefault();
          const scaleBy = 1.1;
          const oldScale = scale;
          const mousePointTo = {
            x: stageRef.current!.getPointerPosition()!.x / oldScale - stageRef.current!.x() / oldScale,
            y: stageRef.current!.getPointerPosition()!.y / oldScale - stageRef.current!.y() / oldScale,
          };
          const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
          setScale(newScale);
          stageRef.current!.scale({ x: newScale, y: newScale });
          const newPos = {
            x: -(mousePointTo.x - stageRef.current!.getPointerPosition()!.x / newScale) * newScale,
            y: -(mousePointTo.y - stageRef.current!.getPointerPosition()!.y / newScale) * newScale,
          };
          stageRef.current!.position(newPos);
          stageRef.current!.batchDraw();
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        ref={stageRef}
      >
        <Layer>
          {pixels.map((pixel) => (
            <Rect
              key={pixel.id}
              x={pixel.x * 10}
              y={pixel.y * 10}
              width={10}
              height={10}
              fill={pixel.color}
              stroke="#ddd"
              strokeWidth={0.5}
            />
          ))}
          <Text text={`${cursorPos.x}, ${cursorPos.y}`} x={cursorPos.x * 10} y={cursorPos.y * 10} fontSize={15} fill="black" />
        </Layer>
      </Stage>
    </div>
  );
};

export default AdvancedViewport;
