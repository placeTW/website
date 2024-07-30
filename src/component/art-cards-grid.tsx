import { Box, SimpleGrid } from "@chakra-ui/react";
import { ArtInfo } from "../types/art";
import ArtCard from "./art-card";
import { FC } from "react";
import { useUserContext } from "../context/user-context";

interface ArtCardsGridProps {
  artPieces: ArtInfo[];
}

const ArtCardsGrid: FC<ArtCardsGridProps> = ({ artPieces }) => {
  const { users } = useUserContext();

  const getUserHandle = (userId: string) => {
    const user = users.find((u) => u.user_id === userId);
    return user ? user.handle : "Unknown";
  };

  return (
    <SimpleGrid minChildWidth="300px" spacing="40px" m={2}>
      {artPieces.map((artPiece) => (
        <Box key={artPiece.id}>
          <ArtCard
            artPiece={artPiece}
            userId={artPiece.created_by_user_id}
            userHandle={getUserHandle(artPiece.created_by_user_id)}
          />
        </Box>
      ))}
    </SimpleGrid>
  );
};

export default ArtCardsGrid;
