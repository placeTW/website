import { Box, SimpleGrid } from "@chakra-ui/react";
import { FC } from "react";
import { GalleryArtInfo } from "../../types/gallery";
import GalleryArtCard from "./gallery-art-card";

interface ArtCardsProp {
  artPieces: GalleryArtInfo[];
}

const ArtCardsGrid: FC<ArtCardsProp> = ({ artPieces }) => {
  return (
    <SimpleGrid minChildWidth="300px" spacing="40px" m={2}>
      {artPieces.map((artPiece) => (
        <Box key={artPiece.art_id}>
          <GalleryArtCard artPiece={artPiece} />
        </Box>
      ))}
    </SimpleGrid>
  );
};

export default ArtCardsGrid;
