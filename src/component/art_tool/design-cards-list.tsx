import { Box, Flex, useToast } from "@chakra-ui/react";
import {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { Design, Pixel } from "../../types/art-tool";
import DesignCard from "./design-card";

interface DesignCardsListProps {
  designs: Design[];
  visibleLayers: number[];
  layerOrder: number[];
  editDesignId: number | null;
  setEditDesignId: Dispatch<SetStateAction<number | null>>;
  onEditStateChange: (isEditing: boolean, designId: number | null) => void;
  onVisibilityChange: (visibleLayers: number[]) => void;
  onSubmitEdit: (designName: string) => void;
  onSetCanvas: (designId: number, canvasId: number) => void;
  onDeleted: (designId: number) => void;
  onSelectDesign: (designId: number) => void;
  onMoveDesignUp: (designId: number) => void;
  onMoveDesignDown: (designId: number) => void;
  editedPixels: Pixel[];
  searchQuery: string;
}

const DesignCardsList: FC<DesignCardsListProps> = ({
  designs,
  visibleLayers,
  layerOrder,
  editDesignId,
  setEditDesignId,
  onEditStateChange,
  onVisibilityChange,
  onSubmitEdit,
  onSetCanvas,
  onDeleted,
  onSelectDesign,
  onMoveDesignUp,
  onMoveDesignDown,
  editedPixels,
  searchQuery,
}) => {
  const [visibilityMap, setVisibilityMap] = useState<Record<number, boolean>>(
    {},
  );
  const [sortedDesigns, setSortedDesigns] = useState<Design[]>([])
  const toast = useToast();
  const isFirstRender = useRef(true);
  const previousVisibleLayers = useRef<number[]>([]);
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleEdit = (designId: number): boolean => {
    if (editDesignId && editDesignId !== designId) {
      toast({
        title: "Edit in Progress",
        description: "You can only edit one card at a time.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    setEditDesignId(designId);
    onEditStateChange(true, designId);
    return true;
  };

  const handleCancelEdit = (): boolean => {
    setEditDesignId(null);
    onEditStateChange(false, null);
    return true;
  };

  const handleToggleVisibility = (designId: number, isVisible: boolean) => {
    setVisibilityMap((prev) => {
      const updated = { ...prev };

      if (isVisible) {
        updated[designId] = true;
      } else {
        delete updated[designId];
      }

      return updated;
    });
  };

  const handleOnDeleted = (designId: number) => {
    // Call the parent onDeleted function to update the state in DesignOffice
    onDeleted(designId);

    setVisibilityMap((prev) => {
      const updated = { ...prev };
      delete updated[designId];
      return updated;
    });

    setEditDesignId(null);
  };

  // Helper function to compare arrays efficiently without JSON.stringify
  const arraysAreEqual = (a: number[], b: number[]): boolean => {
    if (a.length !== b.length) return false;
    
    // Sort arrays for consistent comparison
    const sortedA = [...a].sort((x, y) => x - y);
    const sortedB = [...b].sort((x, y) => x - y);
    
    // Compare each element
    for (let i = 0; i < sortedA.length; i++) {
      if (sortedA[i] !== sortedB[i]) return false;
    }
    
    return true;
  };
  
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Create newVisibleLayers array directly with a known size for better performance
    const visibleLayerKeys = Object.keys(visibilityMap).filter(
      (layer) => visibilityMap[Number(layer)]
    );
    
    const newVisibleLayers = new Array(visibleLayerKeys.length);
    for (let i = 0; i < visibleLayerKeys.length; i++) {
      newVisibleLayers[i] = Number(visibleLayerKeys[i]);
    }

    // Use the optimized comparison function instead of JSON.stringify
    if (!arraysAreEqual(newVisibleLayers, previousVisibleLayers.current)) {
      previousVisibleLayers.current = newVisibleLayers;
      onVisibilityChange(newVisibleLayers);
    }
  }, [visibilityMap, onVisibilityChange]);

  useEffect(() => {
    const newVisibilityMap: Record<number, boolean> = {};

    visibleLayers.forEach((layer) => {
      newVisibilityMap[layer] = true;
    });

    setVisibilityMap(newVisibilityMap);
  }, [visibleLayers]);

  useEffect(() => {
    // Memoize searchQuery conversion and convert to lowercase once
    const normalizedQuery = searchQuery.toLowerCase();
    
    // Avoid creating a new array if the query is empty
    const filteredDesigns = normalizedQuery === '' 
      ? designs 
      : designs.filter((design) => design.design_name.toLowerCase().includes(normalizedQuery));

    // Create a map for efficient lookups
    const designsMap = new Map(filteredDesigns.map(design => [design.id, design]));
    
    // Create the ordered designs array with a known maximum size
    const orderedObjects: Design[] = [];
    
    // First add designs in layer order
    for (const id of layerOrder) {
      const design = designsMap.get(id);
      if (design) {
        orderedObjects.push(design);
        designsMap.delete(id); // Remove from map to avoid checking again
      }
    }
    
    // Then add remaining designs
    if (designsMap.size > 0) {
      designsMap.forEach(design => {
        orderedObjects.push(design);
      });
    }
    
    setSortedDesigns(orderedObjects);
  }, [designs, layerOrder, searchQuery])

  return (
    <Flex direction="column" m={4} gap={4}>
      {sortedDesigns.map((design) => (
        <Box
          key={design.id}
          id={`design-card-${design.id}`}
          ref={(el) => (cardRefs.current[design.id] = el)}
        >
          <DesignCard
            design={design}
            isEditing={editDesignId === design.id}
            inEditMode={!!editDesignId && editDesignId > 0}
            onEdit={handleEdit}
            onCancelEdit={handleCancelEdit}
            onToggleVisibility={handleToggleVisibility}
            isVisible={visibilityMap[design.id] ?? false}
            onSubmitEdit={onSubmitEdit}
            onSetCanvas={onSetCanvas}
            onDeleted={handleOnDeleted}
            editedPixels={editedPixels}
            onSelect={onSelectDesign}
            onMoveDesignUp={onMoveDesignUp}
            onMoveDesignDown={onMoveDesignDown}
          />
        </Box>
      ))}
    </Flex>
  );
};

export default DesignCardsList;
