import { Box, Flex, Text } from "@chakra-ui/react";
import Konva from "konva";
import React, {
  forwardRef,
  Ref,
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
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
import { useImage, useOptimizedPixelMap, useOptimizedVisibleBounds } from "./hooks";
import { ViewportHandle, ViewportPixel } from "./types";
import { roundToNearestPowerOf2 } from "./utils";
import ViewportContextMenu, { ContextMenuDesign } from "./ViewportContextMenu";
import { VirtualizedPixelRenderer } from "./VirtualizedPixelRenderer";

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
  selectedTool?: 'paint' | 'erase' | 'select' | 'eyedropper';
  ref?: Ref<ViewportHandle>;
}

// Use React.memo to prevent unnecessary re-renders of the entire component
const Viewport = React.memo(forwardRef<ViewportHandle, ViewportProps>(
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
      selectedTool = 'paint',
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
    // Removed the pixelMap state as we're now using useMemo instead
    const [stageDraggable, setStageDraggable] = useState(false);
    const { colorsMap } = useColorContext();
    const { designsMap } = useDesignContext();
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

    // Use optimized pixel map with incremental updates
    const pixelMap = useOptimizedPixelMap(pixels);

    // Optimized tile calculation with proper requestAnimationFrame management
    const animationFrameRef = useRef<number | null>(null);
    
    const calculateVisibleTiles = useCallback(() => {
      if (!stageRef.current) return;

      const stage = stageRef.current;
      const scale = stage.scaleX();
      setZoomLevel(scale);

      if (scale <= 0.125) {
        setVisibleTiles([]);
        return;
      }

      // Cancel previous animation frame to prevent accumulation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Use requestAnimationFrame for smoother updates during interactions
      animationFrameRef.current = requestAnimationFrame(() => {
        const viewWidth = stage.width() / scale;
        const viewHeight = stage.height() / scale;
        const offsetX = -stage.x() / scale;
        const offsetY = -stage.y() / scale;

        const minX = Math.floor(offsetX / BACKGROUND_TILE_SIZE);
        const minY = Math.floor(offsetY / BACKGROUND_TILE_SIZE);
        const maxX = Math.ceil((offsetX + viewWidth) / BACKGROUND_TILE_SIZE);
        const maxY = Math.ceil((offsetY + viewHeight) / BACKGROUND_TILE_SIZE);

        // Optimized tile generation using single loop
        const tilesCount = (maxX - minX) * (maxY - minY);
        const newVisibleTiles = Array(tilesCount);
        const widthRange = maxX - minX;
        
        // Single loop instead of nested loops for better performance
        for (let i = 0; i < tilesCount; i++) {
          const x = minX + (i % widthRange);
          const y = minY + Math.floor(i / widthRange);
          newVisibleTiles[i] = { x, y };
        }

        // Efficient comparison using string serialization for small arrays
        setVisibleTiles((prev) => {
          if (prev.length !== newVisibleTiles.length) return newVisibleTiles;
          
          // Fast comparison by checking first and last elements
          if (prev.length > 0) {
            const first = prev[0];
            const last = prev[prev.length - 1];
            const newFirst = newVisibleTiles[0];
            const newLast = newVisibleTiles[newVisibleTiles.length - 1];
            
            if (first.x === newFirst.x && first.y === newFirst.y &&
                last.x === newLast.x && last.y === newLast.y) {
              return prev; // Likely no change
            }
          }
          
          return newVisibleTiles;
        });
        
        animationFrameRef.current = null;
      });
    }, [BACKGROUND_TILE_SIZE, stageRef]);
    
    // Cleanup animation frame on unmount
    useEffect(() => {
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, []);

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

    // Refs for drag handling - will be defined after bounds hook
    const dragMoveTimeoutRef = useRef<number | null>(null);
    const lastVisibleUpdateRef = useRef<number>(0);

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

    // Throttle wheel events to prevent performance issues
    const wheelHandlerTimeoutRef = useRef<number | null>(null);
    const pendingWheelEventRef = useRef<Konva.KonvaEventObject<WheelEvent> | null>(null);
    
    // Optimize wheel handler with throttling and smoother zooming
    const modifiedWheelHandler = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      
      // Store the latest event
      pendingWheelEventRef.current = e;
      
      // If there's already a timeout scheduled, don't create another one
      if (wheelHandlerTimeoutRef.current !== null) return;
      
      // Process wheel events in a requestAnimationFrame for smoother experience
      wheelHandlerTimeoutRef.current = window.requestAnimationFrame(() => {
        if (!pendingWheelEventRef.current) return;
        
        const event = pendingWheelEventRef.current;
        pendingWheelEventRef.current = null;
        wheelHandlerTimeoutRef.current = null;
        
        const scaleBy = 2;
        const stage = event.target.getStage();
        if (!stage) return;
        
        const oldScale = stage.scaleX();
        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;
        
        const mousePointTo = {
          x: pointerPos.x / oldScale - stage.x() / oldScale,
          y: pointerPos.y / oldScale - stage.y() / oldScale,
        };
        
        let newScale = event.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
        newScale = Math.max(MIN_ZOOM_LEVEL, Math.min(MAX_ZOOM_LEVEL, newScale));
        newScale = roundToNearestPowerOf2(newScale);
        
        // Only update if scale actually changed
        if (newScale !== oldScale) {
          stage.scale({ x: newScale, y: newScale });
          
          const newPos = {
            x: -(mousePointTo.x - pointerPos.x / newScale) * newScale,
            y: -(mousePointTo.y - pointerPos.y / newScale) * newScale,
          };
          
          stage.position(newPos);
          handleZoom();
        }
      });
    }, [handleZoom, MIN_ZOOM_LEVEL, MAX_ZOOM_LEVEL]);
    
    // Clean up the animation frame on unmount
    useEffect(() => {
      return () => {
        if (wheelHandlerTimeoutRef.current !== null) {
          cancelAnimationFrame(wheelHandlerTimeoutRef.current);
        }
      };
    }, []);

    // Optimize the color lookup map creation to avoid unnecessary iterations
    const colorLookupMap = useMemo(() => {
      const lookup = new Map<string, { color: string; colorName: string | undefined }>();
      
      // Create a mapping of designId to its position in the layerOrder array for faster lookups
      const layerOrderMap = new Map<number, number>();
      layerOrder.forEach((id, index) => layerOrderMap.set(id, index));
      
      // Process each coordinate only once
      pixelMap.forEach((pixelsAtCoordinate, key) => {
        if (!pixelsAtCoordinate || pixelsAtCoordinate.length === 0) return;
        
        // Sort pixels by their layer order for efficient processing
        const sortedPixels = [...pixelsAtCoordinate].sort((a, b) => {
          const orderA = layerOrderMap.get(a.designId) ?? Infinity;
          const orderB = layerOrderMap.get(b.designId) ?? Infinity;
          return orderA - orderB;
        });
        
        // Take the top-most visible pixel
        const topPixel = sortedPixels[0];
        const colorObj = colorsMap.get(topPixel.color);
        
        if (colorObj) {
          lookup.set(key, { 
            color: colorObj.Color,
            colorName: colorObj.color_name 
          });
        }
      });
      
      return lookup;
    }, [pixelMap, layerOrder, colorsMap]);
    
    // Faster lookup using the pre-computed map
    const getColorForPixel = useCallback((x: number, y: number) => {
      const key = `${x} - ${y}`;
      const lookup = colorLookupMap.get(key);
      
      if (!lookup) return undefined;
      
      return {
        Color: lookup.color,
        color_name: lookup.colorName,
        color_sort: null // Not needed for rendering
      };
    }, [colorLookupMap]);
    
    // Optimize the context menu handler to avoid unnecessary object creation
    const handleContextMenu = useCallback((e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();
      if (!stageRef.current || !hoveredPixel) return;

      const key = `${hoveredPixel.x} - ${hoveredPixel.y}`;
      const pixelsAtCoordinate = pixelMap.get(key) || [];
      
      if (pixelsAtCoordinate.length === 0) return;
      
      // Create a mapping of designId to its position in the layerOrder array
      const layerOrderMap = new Map<number, number>();
      layerOrder.forEach((id, index) => layerOrderMap.set(id, index));
      
      // Sort pixels by their layer order for consistent display
      const sortedPixels = [...pixelsAtCoordinate].sort((a, b) => {
        const orderA = layerOrderMap.get(a.designId) ?? Infinity;
        const orderB = layerOrderMap.get(b.designId) ?? Infinity;
        return orderA - orderB;
      });
      
      // Pre-calculate designs instead of calculating them on each render
      const designsAtPixel = sortedPixels.map((pixel) => {
        const design = designsMap.get(pixel.designId);
        const color = colorsMap.get(pixel.color);
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
    }, [hoveredPixel, pixelMap, layerOrder, designsMap, colorsMap, stageRef]);

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

    // Optimize centerOnCanvas by pre-calculating bounds for visible pixels
    const canvasBounds = useMemo(() => {
      if (pixelMap.size === 0) return null;
      
      // Only do this calculation once for all pixels
      const allPixels = Array.from(pixelMap.values()).flat();
      const { x: minX, y: minY } = getTopLeftCoords(allPixels);
      const { width: boxWidth, height: boxHeight } = getDimensions(
        offsetPixels(allPixels, { x: minX, y: minY }),
      );
      
      return {
        minX,
        minY,
        boxWidth,
        boxHeight,
        centerX: minX + boxWidth / 2,
        centerY: minY + boxHeight / 2
      };
    }, [pixelMap]);
    
    const centerOnCanvas = useCallback(() => {
      if (!stageRef.current || !canvasBounds) return;

      const stage = stageRef.current;
      const stageWidth = stage.width();
      const stageHeight = stage.height();
      
      const { boxWidth, boxHeight, centerX, centerY } = canvasBounds;

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

      // Use pre-calculated center point
      const newX = stageWidth / 2 - centerX * GRID_SIZE * newScale;
      const newY = stageHeight / 2 - centerY * GRID_SIZE * newScale;

      stage.position({ x: newX, y: newY });
      stage.batchDraw();

      setZoomLevel(newScale);
      calculateVisibleTiles();
    }, [
      stageRef,
      canvasBounds,
      GRID_SIZE,
      PADDING_FACTOR,
      MAX_ZOOM_LEVEL,
      calculateVisibleTiles,
    ]);

    React.useImperativeHandle(ref, () => ({
      centerOnDesign,
      centerOnCanvas,
    }));

    const renderBackgroundTiles = useMemo(() => 
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
              listening={false} // Disable event listening for background tiles
            />
          ))
        : null,
    [zoomLevel, visibleTiles, backgroundImage, BACKGROUND_TILE_SIZE]);

    // Use optimized visible bounds calculation that only recalculates when necessary
    const { visibleBounds, forceRecalculation } = useOptimizedVisibleBounds(stageRef, GRID_SIZE, dimensions, zoomLevel);

    // Improved drag handling with debounced tile calculation but immediate visual updates
    const handleDragMove = useCallback(() => {
      // Update visible bounds immediately for pixel rendering
      if (!stageRef.current) return;
      
      // Force recalculation of visible bounds for smooth pixel rendering during drag
      forceRecalculation();
      
      // Force update the zoom level so dependent components recalculate
      setZoomLevel(stageRef.current.scaleX());
      
      // Throttle the expensive tile calculations
      const now = Date.now();
      if (now - lastVisibleUpdateRef.current > 50) { // 50ms throttle
        lastVisibleUpdateRef.current = now;
        
        // Clear any pending timeout
        if (dragMoveTimeoutRef.current !== null) {
          clearTimeout(dragMoveTimeoutRef.current);
        }
        
        // Schedule the tiles update
        dragMoveTimeoutRef.current = window.setTimeout(() => {
          dragMoveTimeoutRef.current = null;
          calculateVisibleTiles();
        }, 20); // Short delay for better UX
      }
    }, [calculateVisibleTiles, stageRef, forceRecalculation]);
    
    // Clean up the timeout on unmount
    useEffect(() => {
      return () => {
        if (dragMoveTimeoutRef.current !== null) {
          clearTimeout(dragMoveTimeoutRef.current);
        }
      };
    }, []);

    // Memoize the pixel grid rendering for better performance, render only visible pixels
    // Use virtualized pixel rendering for better performance
    const renderPixelGrid = useCallback(() => {
      return (
        <VirtualizedPixelRenderer
          colorLookupMap={colorLookupMap}
          visibleBounds={visibleBounds}
          gridSize={GRID_SIZE}
        />
      );
    }, [colorLookupMap, visibleBounds, GRID_SIZE]);

    const renderSelectionRect = useMemo(() =>
      selection && (
        <Rect
          x={selection.x * GRID_SIZE}
          y={selection.y * GRID_SIZE}
          width={selection.width * GRID_SIZE}
          height={selection.height * GRID_SIZE}
          stroke="blue"
          strokeWidth={2}
          dash={[4, 4]}
          listening={false} // Disable event listening for selection rect
        />
      ),
    [selection, GRID_SIZE]);

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
          willChange: "transform", // Optimize for layer compositing
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
            selectedTool,
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
          perfectDrawEnabled={false} // Improve performance by disabling perfect drawing
          imageSmoothingEnabled={false} // Disable image smoothing for pixel art
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
                listening={false} // Disable event listening for background
              />
            )}
            {renderBackgroundTiles}
          </Layer>
          <Layer listening={false}>{renderPixelGrid()}</Layer>
          <Layer listening={false}>{renderSelectionRect}</Layer>
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
));

export default Viewport;

// Add a displayName for easier debugging
Viewport.displayName = 'Viewport';
