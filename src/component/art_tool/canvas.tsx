import { Box, Grid } from "@chakra-ui/react";
import {
  CanvasHoverPixelChangeHandler,
  Dotting,
  DottingRef,
  useHandlers,
} from "dotting";
import { FC, useEffect, useRef, useState } from "react";
import { databaseFetchColors } from "../../api/supabase";
import { createDottingData } from "../../utils/dotting";

interface CanvasProps {
  isEditing?: boolean;
}

const Canvas: FC<CanvasProps> = ({ isEditing }) => {
  const [colors, setColors] = useState<
    { Color: string; color_sort: number | null }[]
  >([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const ref = useRef<DottingRef>(null);
  const {
    addCanvasElementEventListener,
    removeCanvasElementEventListener,
    addHoverPixelChangeListener,
    removeHoverPixelChangeListener,
  } = useHandlers(ref);

  const [hoveredPixel, setHoveredPixel] = useState<{
    rowIndex: number;
    columnIndex: number;
  } | null>(null);
  const handleHoverPixelChangeHandler: CanvasHoverPixelChangeHandler = ({
    indices,
  }) => {
    setHoveredPixel(indices);
  };
  const coordinatesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchColors = async () => {
      setColors(await databaseFetchColors());
    };
    fetchColors();
  });

  useEffect(() => {
    const renderer: EventListenerOrEventListenerObject = (e: any) => {
      if (coordinatesRef.current) {
        coordinatesRef.current.style.left = `${e.offsetX + 10}px`;
        coordinatesRef.current.style.top = `${e.offsetY + 10}px`;
      }
    };
    addHoverPixelChangeListener(handleHoverPixelChangeHandler);
    addCanvasElementEventListener("mousemove", renderer);
    return () => {
      removeHoverPixelChangeListener(handleHoverPixelChangeHandler);
      removeCanvasElementEventListener("mousemove", renderer);
    };
  }, []);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  return (
    <Box width="100%" height="100%" position="relative">
      <Dotting
        ref={ref}
        width="100%"
        height="100%"
        isGridFixed={true}
        initLayers={[
          {
            id: "layer1",
            data: createDottingData(100, 50),
          }
        ]}
      />

      {isEditing && (
        <Box
          position="absolute"
          bottom="10px"
          left="50%"
          transform="translateX(-50%)"
          zIndex="100"
        >
          <Grid templateColumns={`repeat(${colors.length}, 1fr)`} gap={2}>
            {colors.map((color) => (
              <Box
                key={color.Color}
                w="30px"
                h="30px"
                bg={color.Color}
                border={
                  selectedColor === color.Color
                    ? "2px solid black"
                    : "1px solid #ccc"
                }
                cursor="pointer"
                onClick={() => handleColorSelect(color.Color)}
              />
            ))}
          </Grid>
        </Box>
      )}
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
          {hoveredPixel.columnIndex}, {hoveredPixel.rowIndex}
        </div>
      )}
    </Box>
  );
};

export default Canvas;
