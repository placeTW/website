import { Box, SimpleGrid } from "@chakra-ui/react";
import { ArtInfo } from "../types/art";
import ArtCard from "./art-card";
import { FC } from "react";

interface ArtCardsProp {
  artPieces: ArtInfo[];
}

const ArtCardsGrid: FC<ArtCardsProp> = ({ artPieces }) => {
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

export default ArtCardsGrid;
