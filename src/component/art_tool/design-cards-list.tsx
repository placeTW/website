import { Box, Flex, useToast } from "@chakra-ui/react";
import {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { Design, Pixel } from "../../types/art-tool";
import DesignCard from "./design-card";

interface DesignCardsListProps {
  designs: Design[];
  visibleLayers: number[];
  editDesignId: number | null;
  setEditDesignId: Dispatch<SetStateAction<number | null>>;
  onEditStateChange: (isEditing: boolean, designId: number | null) => void;
  onVisibilityChange: (visibleLayers: number[]) => void;
  onSubmitEdit: (designName: string) => void;
  onSetCanvas: (designId: number, canvasId: number) => void;
  onDeleted: (designId: number) => void;
  editedPixels: Pixel[];
}

const DesignCardsList: FC<DesignCardsListProps> = ({
  designs,
  visibleLayers,
  editDesignId,
  setEditDesignId,
  onEditStateChange,
  onVisibilityChange,
  onSubmitEdit,
  onSetCanvas,
  onDeleted,
  editedPixels,
}) => {
  const toast = useToast();
  const [visibleDesigns, setVisibleDesigns] = useState<Design[]>([]);

  useEffect(() => {
    const filteredDesigns = visibleLayers.length === 0
      ? designs
      : designs.filter(design => visibleLayers.includes(design.id));
    const sortedDesigns = filteredDesigns.sort((a, b) => b.liked_by.length - a.liked_by.length);
    setVisibleDesigns(sortedDesigns);
  }, [designs, visibleLayers]);

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
    const updatedVisibleLayers = isVisible
      ? [...visibleLayers, designId]
      : visibleLayers.filter(id => id !== designId);
    onVisibilityChange(updatedVisibleLayers);
  };

  const handleOnDeleted = (designId: number) => {
    onDeleted(designId);
    onVisibilityChange(visibleLayers.filter(id => id !== designId));
    setEditDesignId(null);
  };

  return (
    <Flex direction="column" m={4} gap={4}>
      {visibleDesigns.map((design) => (
        <Box key={design.id}>
          <DesignCard
            design={design}
            canvasName={design?.canvas_name ?? ""}
            isEditing={editDesignId === design.id}
            onEdit={handleEdit}
            onCancelEdit={handleCancelEdit}
            onToggleVisibility={handleToggleVisibility}
            isVisible={true}
            onSubmitEdit={onSubmitEdit}
            onSetCanvas={onSetCanvas}
            onDeleted={handleOnDeleted}
            editedPixels={editedPixels}
          />
        </Box>
      ))}
    </Flex>
  );
};

export default DesignCardsList;