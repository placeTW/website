import { Box, SimpleGrid } from "@chakra-ui/react";
import { FC } from "react";
import { useUserContext } from "../../context/user-context";
import { DesignInfo } from "../../types/art-tool";
import DesignCard from "./design-card";

interface DesignCardsListProps {
  designs: DesignInfo[];
}

const DesignCardsList: FC<DesignCardsListProps> = ({ designs }) => {
  const { users } = useUserContext();

  // Sort designs by number of likes
  const sortedDesigns = [...designs].sort((a, b) => b.liked_by.length - a.liked_by.length);

  const getUserHandle = (userId: string) => {
    const user = users.find((u) => u.user_id === userId);
    return user ? user.handle : "Unknown";
  };

  return (
    <SimpleGrid minChildWidth="300px" spacing="20px" m={4}>
      {sortedDesigns.map((design) => (
        <Box key={design.id}>
          <DesignCard
            design={design}
            userId={design.created_by}
            userHandle={getUserHandle(design.created_by)}
          />
        </Box>
      ))}
    </SimpleGrid>
  );
};

export default DesignCardsList;
