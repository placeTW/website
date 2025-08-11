import { Box, Flex, Text } from "@chakra-ui/react";
import Konva from "konva";
import React, {
  forwardRef,
  Ref,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Image as KonvaImage, Layer, Rect, Stage } from "react-konva";
import { useColorContext } from "../../context/color-context";
import { useDesignContext } from "../../context/design-context";
import {
  getDimensions,
  getTopLeftCoords,
  offsetPixels,
} from "../../utils/pixelUtils";
import { GRID_SIZE } from "./constants";
import { useMouseHandlers, useTouchHandlers } from "./handlers";
import { useImage } from "./hooks";
import { ViewportHandle, ViewportPixel } from "./types";
import { roundToNearestPowerOf2 } from "./utils";
import ViewportContextMenu, { ContextMenuDesign } from "./ViewportContextMenu";

interface ViewportProps {
  stageRef: React.RefObject<Konva.Stage>;
  pixels: ViewportPixel[];
  layerOrder: number[];
  designId?: number | null;
  isEditing?: boolean;
  onPixelPaint?: (x: number, y: number, erase: boolean) => void;
  selection?: { x: number; y: number; width: number; height: number } | null;
  setSelection?: React.Dispatch<
    React.SetStateAction<{
      x: number;
      y: number;
      width: number;
      height: number;
    } | null>
  >;
  onCopy?: () => void;
  onPaste?: (x: number, y: number) => void;
  onDesignSelect?: (designId: number) => void;
  ref?: Ref<ViewportHandle>;
}

const Viewport = forwardRef<ViewportHandle, ViewportProps>(
  (
    {
      // designId,
      pixels,
      isEditing = false,
      onPixelPaint,
      layerOrder,
      selection,
      setSelection,
      onCopy,
      onPaste,
      onDesignSelect,
      stageRef,
    },
    ref,
  ) => {
    const [hoveredPixel, setHoveredPixel] = useState<{
      x: number;
      y: number;
    } | null>(null);
    const coordinatesRef = useRef<HTMLDivElement>(null);
    const divRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [backgroundImage] = useImage("/images/background.png");
    const [visibleTiles, setVisibleTiles] = useState<
      { x: number; y: number }[]
    >([]);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [pixelMap, setPixelMap] = useState<Map<string, ViewportPixel[]>>(
      new Map(),
    );
    const [stageDraggable, setStageDraggable] = useState(false);
    const { colors } = useColorContext();
    const { designs } = useDesignContext();
    const [contextMenu, setContextMenu] = useState<{
      isOpen: boolean;
      position: { x: number; y: number };
      designs: ContextMenuDesign[];
    }>({
      isOpen: false,
      position: { x: 0, y: 0 },
      designs: [],
    });

    const BACKGROUND_TILE_SIZE = 1000;
    const MIN_ZOOM_LEVEL = 1 / 128;
    const MAX_ZOOM_LEVEL = 8;
    const PADDING_FACTOR = 0.75;

    useEffect(() => {
      setStageDraggable(false);
    }, [isEditing]);

    useEffect(() => {
      const newPixelMap = new Map<string, ViewportPixel[]>();

      for (const pixel of pixels) {
        const key = `${pixel.x} - ${pixel.y}`;
        if (!newPixelMap.has(key)) {
          newPixelMap.set(key, []);
        }
        newPixelMap.get(key)!.push(pixel);
      }

      setPixelMap(newPixelMap);
    }, [pixels]);

    const calculateVisibleTiles = useCallback(() => {
      if (!stageRef.current) return;

      const stage = stageRef.current;
      const scale = stage.scaleX();
      setZoomLevel(scale);

      if (scale <= 0.125) {
        setVisibleTiles([]);
        return;
      }

      const viewWidth = stage.width() / scale;
      const viewHeight = stage.height() / scale;
      const offsetX = -stage.x() / scale;
      const offsetY = -stage.y() / scale;

      const minX = Math.floor(offsetX / BACKGROUND_TILE_SIZE);
      const minY = Math.floor(offsetY / BACKGROUND_TILE_SIZE);
      const maxX = Math.ceil((offsetX + viewWidth) / BACKGROUND_TILE_SIZE);
      const maxY = Math.ceil((offsetY + viewHeight) / BACKGROUND_TILE_SIZE);

      const newVisibleTiles = [];
      for (let x = minX; x < maxX; x++) {
        for (let y = minY; y < maxY; y++) {
          newVisibleTiles.push({ x, y });
        }
      }

      setVisibleTiles(newVisibleTiles);
    }, [BACKGROUND_TILE_SIZE, stageRef]);

    useEffect(() => {
      calculateVisibleTiles();
    }, [dimensions, calculateVisibleTiles]);

    useEffect(() => {
      if (!divRef.current) return;
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      });
      resizeObserver.observe(divRef.current);
      return () => resizeObserver.disconnect();
    }, []);

    useEffect(() => {
      if (stageRef.current) {
        const layer = stageRef.current.getLayers()[0];
        const context = layer.getCanvas().getContext();
        if (context) {
          context.imageSmoothingEnabled = false;
        }
        stageRef.current.container().style.cursor = "crosshair";
      }
    }, [backgroundImage, stageRef]);

    const handleDragStart = () => {
      if (stageRef.current) {
        stageRef.current.container().style.cursor = "grabbing";
      }
    };

    const handleDragMove = calculateVisibleTiles;

    const handleDragEnd = () => {
      if (stageRef.current) {
        stageRef.current.container().style.cursor = "crosshair";
      }
      calculateVisibleTiles();
    };

    const handleZoom = () => {
      if (stageRef.current) {
        let scale = stageRef.current.scaleX();
        scale = Math.max(MIN_ZOOM_LEVEL, Math.min(MAX_ZOOM_LEVEL, scale));
        scale = roundToNearestPowerOf2(scale);
        stageRef.current.scale({ x: scale, y: scale });
        calculateVisibleTiles();
      }
    };

    const modifiedWheelHandler = (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const scaleBy = 2;
      const stage = e.target.getStage();
      if (!stage) return;

      const oldScale = stage.scaleX();
      const mousePointTo = {
        x: stage.getPointerPosition()!.x / oldScale - stage.x() / oldScale,
        y: stage.getPointerPosition()!.y / oldScale - stage.y() / oldScale,
      };

      let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
      newScale = Math.max(MIN_ZOOM_LEVEL, Math.min(MAX_ZOOM_LEVEL, newScale));
      newScale = roundToNearestPowerOf2(newScale);

      stage.scale({ x: newScale, y: newScale });

      const newPos = {
        x:
          -(mousePointTo.x - stage.getPointerPosition()!.x / newScale) *
          newScale,
        y:
          -(mousePointTo.y - stage.getPointerPosition()!.y / newScale) *
          newScale,
      };
      stage.position(newPos);

      handleZoom();
    };

    const getColorForPixel = (x: number, y: number) => {
      const key = `${x} - ${y}`;
      const pixelsAtCoordinate = pixelMap.get(key);

      if (!pixelsAtCoordinate || pixelsAtCoordinate.length === 0) {
        return undefined;
      }

      for (const layerId of layerOrder) {
        const pixel = pixelsAtCoordinate.find((p) => p.designId === layerId);
        if (pixel) {
          return colors.find((c) => c.Color === pixel.color);
        }
      }

      return undefined;
    };
    
    const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();
      if (!stageRef.current || !hoveredPixel) return;

      const key = `${hoveredPixel.x} - ${hoveredPixel.y}`;

      const pixelsAtCoordinate = pixelMap.get(key) || [];
      const designsAtPixel = pixelsAtCoordinate.map((pixel) => {
        const design = designs.find((d) => d.id === pixel.designId);
        const color = colors.find((c) => c.Color === pixel.color);
        return {
          ...design,
          id: pixel.designId,
          design_name: design?.design_name || "Unknown Design",
          user_handle: design?.user_handle || "Unknown User",
          color: color?.Color || "#000000",
        } as ContextMenuDesign;
      });

      if (designsAtPixel.length === 0) return;

      setContextMenu({
        isOpen: true,
        position: { x: e.evt.clientX, y: e.evt.clientY },
        designs: designsAtPixel,
      });
    };

    const closeContextMenu = () => {
      setContextMenu((prev) => ({ ...prev, isOpen: false }));
    };

    const calculateZoomLevel = (
      stageWidth: number,
      stageHeight: number,
      contentWidthPx: number,
      contentHeightPx: number,
      PADDING_FACTOR: number,
      MAX_ZOOM_LEVEL: number,
    ) => {
      const scaleX = (stageWidth / contentWidthPx) * PADDING_FACTOR;
      const scaleY = (stageHeight / contentHeightPx) * PADDING_FACTOR;
      const rawZoomLevel = Math.min(scaleX, scaleY, MAX_ZOOM_LEVEL);

      return roundToNearestPowerOf2(rawZoomLevel);
    };

    const centerOnDesign = useCallback(
      (x: number, y: number, width: number, height: number) => {
        if (!stageRef.current) return;

        const stage = stageRef.current;
        const stageWidth = stage.width();
        const stageHeight = stage.height();

        const designWidthPx = width * GRID_SIZE;
        const designHeightPx = height * GRID_SIZE;

        const newScale = calculateZoomLevel(
          stageWidth,
          stageHeight,
          designWidthPx,
          designHeightPx,
          PADDING_FACTOR,
          MAX_ZOOM_LEVEL,
        );

        stage.scale({ x: newScale, y: newScale });

        const centerX = x + width / 2;
        const centerY = y + height / 2;

        const newX = stageWidth / 2 - centerX * GRID_SIZE * newScale;
        const newY = stageHeight / 2 - centerY * GRID_SIZE * newScale;

        stage.position({ x: newX, y: newY });
        stage.batchDraw();

        setZoomLevel(newScale);
        calculateVisibleTiles();
      },
      [stageRef, calculateVisibleTiles, MAX_ZOOM_LEVEL],
    );

    const centerOnCanvas = useCallback(() => {
      if (!stageRef.current) return;

      const stage = stageRef.current;
      const stageWidth = stage.width();
      const stageHeight = stage.height();

      const allPixels = Array.from(pixelMap.values()).flat();
      const { x: minX, y: minY } = getTopLeftCoords(allPixels);
      const { width: boxWidth, height: boxHeight } = getDimensions(
        offsetPixels(allPixels, { x: minX, y: minY }),
      );

      const boxWidthPx = boxWidth * GRID_SIZE;
      const boxHeightPx = boxHeight * GRID_SIZE;

      const newScale = calculateZoomLevel(
        stageWidth,
        stageHeight,
        boxWidthPx,
        boxHeightPx,
        PADDING_FACTOR,
        MAX_ZOOM_LEVEL,
      );

      stage.scale({ x: newScale, y: newScale });

      const centerX = minX * GRID_SIZE + (boxWidth * GRID_SIZE) / 2;
      const centerY = minY * GRID_SIZE + (boxHeight * GRID_SIZE) / 2;
      const newX = stageWidth / 2 - centerX * newScale;
      const newY = stageHeight / 2 - centerY * newScale;

      stage.position({ x: newX, y: newY });
      stage.batchDraw();

      setZoomLevel(newScale);
      calculateVisibleTiles();
    }, [
      stageRef,
      pixelMap,
      PADDING_FACTOR,
      MAX_ZOOM_LEVEL,
      calculateVisibleTiles,
    ]);

    React.useImperativeHandle(ref, () => ({
      centerOnDesign,
      centerOnCanvas,
    }));

    const renderBackgroundTiles = () =>
      zoomLevel > 0.125
        ? visibleTiles.map((tile) => (
            <KonvaImage
              key={`tile-${tile.x} - ${tile.y}`}
              image={backgroundImage}
              x={tile.x * BACKGROUND_TILE_SIZE}
              y={tile.y * BACKGROUND_TILE_SIZE}
              width={BACKGROUND_TILE_SIZE}
              height={BACKGROUND_TILE_SIZE}
              perfectDrawEnabled={false}
              imageSmoothingEnabled={false}
            />
          ))
        : null;

    const renderPixelGrid = () => {
      const renderedPixels: JSX.Element[] = [];

      pixelMap.forEach((_, key) => {
        const [x, y] = key.split(" - ").map(Number);
        const color = getColorForPixel(x, y);

        if (color) {
          renderedPixels.push(
            <Rect
              key={`pixel-${x} - ${y}`}
              x={x * GRID_SIZE}
              y={y * GRID_SIZE}
              width={GRID_SIZE}
              height={GRID_SIZE}
              fill={color.Color}
              strokeWidth={0}
            />,
          );
        }
      });

      return renderedPixels;
    };

    const renderSelectionRect = () =>
      selection && (
        <Rect
          x={selection.x * GRID_SIZE}
          y={selection.y * GRID_SIZE}
          width={selection.width * GRID_SIZE}
          height={selection.height * GRID_SIZE}
          stroke="blue"
          strokeWidth={2}
          dash={[4, 4]}
        />
      );

    const renderCoordinates = () => {
      if (!hoveredPixel) return null;

      const color = getColorForPixel(hoveredPixel.x, hoveredPixel.y);

      return (
        <Flex
          ref={coordinatesRef}
          position="absolute"
          backgroundColor="white"
          padding={2}
          border="1px solid black"
          borderRadius="3px"
          pointerEvents="none"
          display="flex"
          direction="column"
          justifyContent="center"
          alignItems="left"
        >
          <Text fontWeight="bold">
            Coordinates: {hoveredPixel.x}, {hoveredPixel.y}
          </Text>
          {color && (
            <Flex direction="row" gap={2} alignItems="center">
              <Box h={4} w={4} border="1px solid black" bg={color.Color} />
              <Text>{color.color_name}</Text>
            </Flex>
          )}
        </Flex>
      );
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
          overflow: "hidden",
          backgroundColor: "#f0f0f0",
        }}
        ref={divRef}
      >
        <Stage
          width={dimensions.width}
          height={dimensions.height}
          ref={stageRef}
          onWheel={modifiedWheelHandler}
          {...useMouseHandlers(
            onPixelPaint,
            isEditing,
            stageRef,
            setHoveredPixel,
            coordinatesRef,
            selection,
            setSelection,
            onCopy,
            onPaste,
            setStageDraggable,
          )}
          {...useTouchHandlers(
            onPixelPaint,
            isEditing,
            setStageDraggable,
            stageRef,
            calculateVisibleTiles,
          )}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          draggable={stageDraggable}
          touchAction="none"
          onContextMenu={handleContextMenu}
        >
          <Layer>
            {zoomLevel <= 0.125 && (
              <Rect
                x={
                  -stageRef.current!.x() / zoomLevel -
                  (dimensions.width * 2.5) / zoomLevel
                }
                y={
                  -stageRef.current!.y() / zoomLevel -
                  (dimensions.height * 2.5) / zoomLevel
                }
                width={(dimensions.width * 5) / zoomLevel}
                height={(dimensions.height * 5) / zoomLevel}
                fill="#f5f5f5"
              />
            )}
            {renderBackgroundTiles()}
          </Layer>
          <Layer>{renderPixelGrid()}</Layer>
          <Layer>{renderSelectionRect()}</Layer>
        </Stage>
        {renderCoordinates()}
        <ViewportContextMenu
          isOpen={contextMenu.isOpen}
          onClose={closeContextMenu}
          position={contextMenu.position}
          designs={contextMenu.designs}
          onDesignSelect={(designId: number) => {
            onDesignSelect?.(designId); // Call onDesignSelect prop when a design is selected
            closeContextMenu();
          }}
        />
      </div>
    );
  },
);

export default Viewport;
