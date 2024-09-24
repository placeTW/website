import { Box } from "@chakra-ui/react";
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
import {
  getDimensions,
  getTopLeftCoords,
  offsetPixels,
} from "../../utils/pixelUtils";
import { CLEAR_ON_MAIN, GRID_SIZE } from "./constants";
import { useMouseHandlers, useTouchHandlers } from "./handlers";
import { useImage } from "./hooks";
import { ViewportHandle, ViewportPixel } from "./types";

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
  ref?: Ref<ViewportHandle>; // Add this line to include the ref prop
}

const Viewport = forwardRef<ViewportHandle, ViewportProps>(
  (
    {
      designId,
      pixels,
      isEditing = false,
      onPixelPaint,
      layerOrder,
      selection,
      setSelection,
      onCopy,
      onPaste,
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
    const [clearOnMainImage] = useImage("/images/ClearOnMain.png");
    const [visibleTiles, setVisibleTiles] = useState<
      { x: number; y: number }[]
    >([]);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [mergedPixels, setMergedPixels] = useState<ViewportPixel[]>([]);
    const [stageDraggable, setStageDraggable] = useState(false);
    const { colors } = useColorContext();

    const BACKGROUND_TILE_SIZE = 1000;
    const MIN_ZOOM_LEVEL = 1 / 128;
    const MAX_ZOOM_LEVEL = 8;
    const PADDING_FACTOR = 0.75;

    useEffect(() => {
      setStageDraggable(false);
    }, [isEditing]);

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

    useEffect(() => {
      const pixelMap = new Map<string, ViewportPixel>();

      for (const layerId of layerOrder) {
        for (const pixel of pixels.filter((p) => p.designId === layerId)) {
          const key = `${pixel.x}-${pixel.y}`;
          pixelMap.set(key, pixel);
        }
      }

      setMergedPixels(Array.from(pixelMap.values()));
    }, [layerOrder, pixels]);

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

        // Apply min and max zoom levels
        scale = Math.max(MIN_ZOOM_LEVEL, Math.min(MAX_ZOOM_LEVEL, scale));

        stageRef.current.scale({ x: scale, y: scale });
        calculateVisibleTiles();
      }
    };

    // Modified wheel handler to incorporate max zoom level
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

      // Apply min and max zoom levels
      newScale = Math.max(MIN_ZOOM_LEVEL, Math.min(MAX_ZOOM_LEVEL, newScale));

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
      const pixel = mergedPixels.find((p) => p.x === x && p.y === y);
      if (!pixel) return undefined;
      return colors.find((c) => c.Color === pixel.color);
    };

    const centerOnDesign = useCallback(
      (x: number, y: number, width: number, height: number) => {
        if (!stageRef.current) return;

        const stage = stageRef.current;
        const stageWidth = stage.width();
        const stageHeight = stage.height();

        // Calculate the design dimensions in pixels
        const designWidthPx = width * GRID_SIZE;
        const designHeightPx = height * GRID_SIZE;

        // Calculate the zoom level to fit the design with padding
        const scaleX = (stageWidth / designWidthPx) * PADDING_FACTOR;
        const scaleY = (stageHeight / designHeightPx) * PADDING_FACTOR;
        const newScale = Math.min(scaleX, scaleY, MAX_ZOOM_LEVEL);

        // Set the new scale
        stage.scale({ x: newScale, y: newScale });

        // Calculate the center position of the design
        const centerX = x + width / 2;
        const centerY = y + height / 2;

        // Calculate the new position to center the design
        const newX = stageWidth / 2 - centerX * GRID_SIZE * newScale;
        const newY = stageHeight / 2 - centerY * GRID_SIZE * newScale;

        // Set the new position
        stage.position({ x: newX, y: newY });

        // Update the stage
        stage.batchDraw();

        // Update the zoom level state
        setZoomLevel(newScale);

        // Recalculate visible tiles
        calculateVisibleTiles();
      },
      [stageRef, calculateVisibleTiles, MAX_ZOOM_LEVEL],
    );

    const centerOnCanvas = useCallback(() => {
      if (!stageRef.current) return;

      const stage = stageRef.current;
      const stageWidth = stage.width();
      const stageHeight = stage.height();

      // Find the bounding box of all the pixels
      const { x: minX, y: minY } = getTopLeftCoords(mergedPixels);
      const { width: boxWidth, height: boxHeight } = getDimensions(
        offsetPixels(mergedPixels, { x: minX, y: minY }),
      );

      // Calculate the dimensions of the bounding box in pixels
      const boxWidthPx = boxWidth * GRID_SIZE;
      const boxHeightPx = boxHeight * GRID_SIZE;

      // Calculate the zoom level to fit the bounding box with padding
      const scaleX = (stageWidth / boxWidthPx) * PADDING_FACTOR;
      const scaleY = (stageHeight / boxHeightPx) * PADDING_FACTOR;
      const newScale = Math.min(scaleX, scaleY, MAX_ZOOM_LEVEL);

      // Set the new scale
      stage.scale({ x: newScale, y: newScale });

      // Calculate the new position to center the bounding box
      const centerX = minX * GRID_SIZE + (boxWidth * GRID_SIZE) / 2;
      const centerY = minY * GRID_SIZE + (boxHeight * GRID_SIZE) / 2;
      const newX = stageWidth / 2 - centerX * newScale;
      const newY = stageHeight / 2 - centerY * newScale;

      // Set the new position
      stage.position({ x: newX, y: newY });

      // Update the stage
      stage.batchDraw();

      // Update the zoom level state
      setZoomLevel(newScale);

      // Recalculate visible tiles
      calculateVisibleTiles();
    }, [
      stageRef,
      mergedPixels,
      GRID_SIZE,
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
              key={`tile-${tile.x}-${tile.y}`}
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

    const renderClearOnMainPixels = () =>
      mergedPixels.map((pixel) => {
        if (pixel.color === CLEAR_ON_MAIN && clearOnMainImage) {
          return (
            <KonvaImage
              key={`pixel-${pixel.x}-${pixel.y}-${pixel.designId}`}
              image={clearOnMainImage}
              x={pixel.x * GRID_SIZE}
              y={pixel.y * GRID_SIZE}
              width={clearOnMainImage.width}
              height={clearOnMainImage.height}
              perfectDrawEnabled={false}
              imageSmoothingEnabled={false}
              visible={!!designId && layerOrder.includes(designId)}
            />
          );
        }
        return null;
      });

    const renderPixelGrid = () =>
      mergedPixels.map((pixel) => (
        <Rect
          key={`pixel-${pixel.x}-${pixel.y}-${pixel.designId}`}
          x={pixel.x * GRID_SIZE}
          y={pixel.y * GRID_SIZE}
          width={GRID_SIZE}
          height={GRID_SIZE}
          fill={pixel.color !== CLEAR_ON_MAIN ? pixel.color : undefined}
          strokeWidth={0}
        />
      ));

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

    const renderCoordinates = () =>
      hoveredPixel && (
        <div
          ref={coordinatesRef}
          style={{
            position: "absolute",
            backgroundColor: "white",
            padding: "2px 4px",
            border: "1px solid black",
            borderRadius: "3px",
            pointerEvents: "none",
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>
            {hoveredPixel.x}, {hoveredPixel.y}
          </span>
          {getColorForPixel(hoveredPixel.x, hoveredPixel.y) && (
            <>
              <Box
                h={4}
                w={4}
                border="1px solid black"
                bg={getColorForPixel(hoveredPixel.x, hoveredPixel.y)?.Color}
              />
              <span>
                {getColorForPixel(hoveredPixel.x, hoveredPixel.y)?.color_name}
              </span>
            </>
          )}
        </div>
      );

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
          <Layer>{renderClearOnMainPixels()}</Layer>
          <Layer>{renderPixelGrid()}</Layer>
          <Layer>{renderSelectionRect()}</Layer>
        </Stage>
        {renderCoordinates()}
      </div>
    );
  },
);

export default Viewport;
