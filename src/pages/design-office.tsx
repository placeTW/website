import React, { useEffect, useState } from 'react';
import { Box, Flex, Spinner } from '@chakra-ui/react';
import AdvancedViewport from '../component/advanced-viewport';
import ArtCardsGrid from '../component/art-cards-grid';
import { supabase } from '../api/supabase';
import { ArtInfo } from '../types/art';

const DesignOffice: React.FC = () => {
  const [artPieces, setArtPieces] = useState<ArtInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArtPieces = async () => {
    const { data, error } = await supabase
      .from('art_tool_layers')
      .select('*');

    if (error) {
      console.error('Error fetching art pieces:', error);
    } else {
      const formattedData = data.map((item: any) => ({
        art_id: item.id.toString(),
        title: item.layer_name,
        blurb: item.created_by_user_id,
        desc: '',
        links: [],
        thumbnail: item.layer_thumbnail
      }));
      setArtPieces(formattedData);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchArtPieces();
  }, []);

  if (loading) {
    return <Spinner size="xl" />;
  }

  return (
    <Flex height="100vh" width="100vw" direction="row">
      <Box flex="3" borderRight="1px solid #ccc">
        <AdvancedViewport />
      </Box>
      <Box flex="1" overflowY="auto">
        <ArtCardsGrid artPieces={artPieces} refreshData={fetchArtPieces} />
      </Box>
    </Flex>
  );
};

export default DesignOffice;
