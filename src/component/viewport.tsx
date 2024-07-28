// src/component/viewport.tsx

import React, { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import { supabase } from '../api/supabase';

const Viewport = () => {
  const [pixels, setPixels] = useState([]);
  const stageRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    const fetchPixels = async () => {
      const { data, error } = await supabase.from('art_tools_pixels').select('*');
      if (error) {
        console.error('Error fetching pixel data:', error);
      } else {
        setPixels(data);
      }
    };

    fetchPixels();

    const pixelSubscription = supabase
      .channel('art_tools_pixels')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'art_tools_pixels' }, (payload) => {
        fetchPixels();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(pixelSubscription);
    };
  }, []);

  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const oldScale = stage.scaleX();

    const pointer = stage.getPointerPosition();

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

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        draggable
        ref={stageRef}
        onWheel={handleWheel}
      >
        <Layer ref={layerRef}>
          {pixels.map((pixel) => (
            <Rect
              key={`${pixel.x}-${pixel.y}`}
              x={pixel.x * 10}
              y={pixel.y * 10}
              width={10}
              height={10}
              fill={pixel.color}
              stroke="black"
              strokeWidth={0.5}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default Viewport;
