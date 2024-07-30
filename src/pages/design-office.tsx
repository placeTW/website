import React, { useEffect, useState } from 'react';
import { Box, Flex, Spinner } from '@chakra-ui/react';
import AdvancedViewport from '../component/advanced-viewport';
import ArtCardsGrid from '../component/art-cards-grid';
import { supabase } from '../api/supabase';
import { ArtInfo } from '../types/art';
import { useUserContext } from '../context/user-context';

const DesignOffice: React.FC = () => {
  const [artPieces, setArtPieces] = useState<ArtInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { users, rankNames } = useUserContext();

  const fetchArtPieces = async () => {
    const { data, error } = await supabase
      .from('art_tool_layers')
      .select('*');

    if (error) {
      console.error('Error fetching art pieces:', error);
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

    setLoading(false);
  };

  useEffect(() => {
    fetchArtPieces();
  }, [users, rankNames]);

  if (loading) {
    return <Spinner size="xl" />;
  }

  return (
    <Flex height="100vh" width="100vw" direction="row">
      <Box flex="3" borderRight="1px solid #ccc">
        <AdvancedViewport />
      </Box>
      <Box flex="1" overflowY="auto">
        <ArtCardsGrid artPieces={artPieces} />
      </Box>
    </Flex>
  );
};

export default DesignOffice;
