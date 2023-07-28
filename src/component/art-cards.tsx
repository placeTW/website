import { Box, SimpleGrid } from "@chakra-ui/react";
import { ArtInfo } from "../types/art";
import ArtCard from "./art-card";

interface ArtCardsProp {
  artPieces: ArtInfo[];
}

const ArtCards: React.FC<ArtCardsProp> = ({ artPieces }) => {
  return (
    <SimpleGrid minChildWidth="300px" spacing="40px" m={2}>
      {artPieces.map((artPiece) => (
        <Box key={artPiece.art_id}>
          <ArtCard artPiece={artPiece} />
        </Box>
      ))}
    </SimpleGrid>
  );
};

export default ArtCards;
