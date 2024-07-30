import { Box, SimpleGrid } from "@chakra-ui/react";
import { ArtInfo } from "../types/art";
import ArtCard from "./art-card";
import { FC, useEffect, useState } from "react";
import { supabase } from "../api/supabase";
import { useUserContext } from "../context/user-context";

interface ArtCardsGridProps {
  artPieces: ArtInfo[];
}

const ArtCardsGrid: FC<ArtCardsGridProps> = ({ artPieces }) => {
  return (
    <SimpleGrid minChildWidth="300px" spacing="40px" m={2}>
      {artPieces.map((artPiece) => (
        <Box key={artPiece.id}>
          <ArtCard artPiece={artPiece} />
        </Box>
      ))}
    </SimpleGrid>
  );
};

export default ArtCardsGrid;
