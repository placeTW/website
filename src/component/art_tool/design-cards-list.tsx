// ./src/component/art_tool/design-cards-list.tsx

import { Box, SimpleGrid, useToast } from "@chakra-ui/react";
import { FC, useState } from "react";
import { useUserContext } from "../../context/user-context";
import { DesignInfo } from "../../types/art-tool";
import DesignCard from "./design-card";

interface DesignCardsListProps {
  designs: DesignInfo[];
}

const DesignCardsList: FC<DesignCardsListProps> = ({ designs }) => {
  const { users } = useUserContext();
  const [currentlyEditingCardId, setCurrentlyEditingCardId] = useState<string | null>(null); // Track the currently editing card
  const toast = useToast();

  // Sort designs by number of likes
  const sortedDesigns = [...designs].sort((a, b) => b.liked_by.length - a.liked_by.length);

  const getUserHandle = (userId: string) => {
    const user = users.find((u) => u.user_id === userId);
    return user ? user.handle : "Unknown";
  };

  const handleEdit = (designId: string) => {
    if (currentlyEditingCardId && currentlyEditingCardId !== designId) {
      toast({
        title: "Edit in Progress",
        description: "You can only edit one card at a time.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return false; // Prevent entering edit mode for another card
    }

    setCurrentlyEditingCardId(designId); // Set the card being edited
    return true;
  };

  const handleCancelEdit = () => {
    setCurrentlyEditingCardId(null); // Reset the editing card ID
  };

  return (
    <SimpleGrid minChildWidth="300px" spacing="20px" m={4}>
      {sortedDesigns.map((design) => (
        <Box key={design.id}>
          <DesignCard
            design={design}
            userId={design.created_by}
            userHandle={getUserHandle(design.created_by)}
            isEditing={currentlyEditingCardId === design.id}
            onEdit={handleEdit}
            onCancelEdit={handleCancelEdit}
          />
        </Box>
      ))}
    </SimpleGrid>
  );
};

export default DesignCardsList;
