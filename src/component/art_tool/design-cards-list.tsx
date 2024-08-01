import { Box, SimpleGrid, useToast } from "@chakra-ui/react";
import { FC, useState, useEffect } from "react";
import { useUserContext } from "../../context/user-context";
import { DesignInfo } from "../../types/art-tool";
import DesignCard from "./design-card";

interface DesignCardsListProps {
  designs: DesignInfo[];
  onEditStateChange: (isEditing: boolean, designId: string | null) => void;
  onVisibilityChange: (visibleLayers: string[]) => void;
}

const DesignCardsList: FC<DesignCardsListProps> = ({ designs, onEditStateChange, onVisibilityChange }) => {
  const { users } = useUserContext();
  const [currentlyEditingCardId, setCurrentlyEditingCardId] = useState<string | null>(null);
  const [visibilityMap, setVisibilityMap] = useState<Record<string, boolean>>({});
  const toast = useToast();

  const getUserHandle = (userId: string) => {
    const user = users.find((u) => u.user_id === userId);
    return user ? user.handle : "Unknown";
  };

  const handleEdit = (designId: string): boolean => {
    if (currentlyEditingCardId && currentlyEditingCardId !== designId) {
      toast({
        title: "Edit in Progress",
        description: "You can only edit one card at a time.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    setCurrentlyEditingCardId(designId);
    onEditStateChange(true, designId);
    return true;
  };

  const handleCancelEdit = (): boolean => {
    setCurrentlyEditingCardId(null);
    onEditStateChange(false, null);
    return true;
  };

  const handleToggleVisibility = (designName: string, isVisible: boolean) => {
    setVisibilityMap(prev => {
      const updated = { ...prev, [designName]: isVisible };

      // Convert updated visibility map to an array of visible layers
      const newVisibleLayers = Object.keys(updated).filter(layer => updated[layer]);

      // Only trigger visibility change if there is an actual change
      if (JSON.stringify(newVisibleLayers) !== JSON.stringify(Object.keys(prev).filter(layer => prev[layer]))) {
        onVisibilityChange(newVisibleLayers);
      }

      return updated;
    });
  };

  return (
    <SimpleGrid minChildWidth="300px" spacing="20px" m={4}>
      {designs.map((design) => (
        <Box key={design.id}>
          <DesignCard
            design={design}
            userId={design.created_by}
            userHandle={getUserHandle(design.created_by)}
            isEditing={currentlyEditingCardId === design.id}
            onEdit={handleEdit}
            onCancelEdit={handleCancelEdit}
            onToggleVisibility={handleToggleVisibility}
            isVisible={visibilityMap[design.design_name] ?? false}
          />
        </Box>
      ))}
    </SimpleGrid>
  );
};

export default DesignCardsList;
