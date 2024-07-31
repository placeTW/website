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

  const getUserHandle = (userId: string) => {
    const user = users.find((u) => u.user_id === userId);
    return user ? user.handle : "Unknown";
  };

  return (
    <SimpleGrid minChildWidth="300px" spacing="20px" m={4}>
      {designs.map((design) => (
        <Box key={design.id}>
          <DesignCard
            design={design}
            userId={design.created_by_user_id}
            userHandle={getUserHandle(design.created_by_user_id)}
          />
        </Box>
      ))}
    </SimpleGrid>
  );
};

export default DesignCardsList;
