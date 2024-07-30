import { Box, SimpleGrid } from "@chakra-ui/react";
import { ArtInfo } from "../types/art";
import ArtCard from "./art-card";
import { FC, useEffect, useState } from "react";
import { supabase } from "../api/supabase";
import { useUserContext } from "../context/user-context";

const ArtCardsGrid: FC = () => {
  const [artPieces, setArtPieces] = useState<ArtInfo[]>([]);
  const { users, rankNames } = useUserContext();

  useEffect(() => {
    const fetchArtPieces = async () => {
      const { data, error } = await supabase
        .from("art_tool_layers")
        .select("*");

      if (error) {
        console.error("Error fetching art pieces:", error);
      } else {
        const artPiecesWithUserInfo = data.map((artPiece: ArtInfo) => {
          const user = users.find((u) => u.user_id === artPiece.created_by_user_id);
          return {
            ...artPiece,
            handle: user ? user.handle : "Unknown",
            rank: user ? user.rank : "Unknown",
            rank_name: user ? rankNames[user.rank] : "Unknown",
          };
        });

        setArtPieces(artPiecesWithUserInfo);
      }
    };

    fetchArtPieces();
  }, [users, rankNames]);

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
