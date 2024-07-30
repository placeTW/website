import React from 'react';
import AdvancedViewport from '../component/advanced-viewport';
import { Box, Flex } from '@chakra-ui/react';
import ArtCardsGrid from '../component/art-cards-grid';
import { ArtInfo } from '../types/art';

// Dummy data for the art pieces
const artPieces: ArtInfo[] = [
  { art_id: '1', title: 'Art Piece 1', blurb: 'Blurb 1', desc: 'Description 1', links: [] },
  { art_id: '2', title: 'Art Piece 2', blurb: 'Blurb 2', desc: 'Description 2', links: [] },
  // Add more art pieces as needed
];

const DesignOffice: React.FC = () => {
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
