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

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const newVisibleLayers = Object.keys(visibilityMap)
      .filter((layer) => visibilityMap[Number(layer)])
      .map(Number);

    if (
      JSON.stringify(newVisibleLayers) !==
      JSON.stringify(previousVisibleLayers.current)
    ) {
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
    const filteredDesigns = designs.filter((design) =>
      design.design_name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const designsMap = new Map(filteredDesigns.map(design => [design.id, design]));

    const orderedObjects = layerOrder
      .map(id => designsMap.get(id))
      .filter(design => design !== undefined);

    filteredDesigns.forEach(design => !orderedObjects.includes(design) && orderedObjects.push(design))

    setSortedDesigns(orderedObjects)
  }, [designs, layerOrder])

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
