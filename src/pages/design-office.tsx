import { Box, Flex, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import AdvancedViewport from "../component/advanced-viewport";
import ArtCardsGrid from "../component/art-cards-grid";
import { supabase } from "../api/supabase";
import CreateLayerButton from "../component/create-layer-button";
import CreateCardModal from "../component/create-card-modal";
import { ArtInfo } from "../types/art";

const DesignOffice: React.FC = () => {
  const [artPieces, setArtPieces] = useState<ArtInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchArtPieces = async () => {
    const { data, error } = await supabase
      .from('art_tool_layers')
      .select('*');

    if (error) {
      console.error('Error fetching art pieces:', error);
    } else {
      const formattedData = data.map((item: any) => ({
        id: item.id.toString(),
        layer_name: item.layer_name,
        created_by_user_id: item.created_by_user_id,
        handle: "",
        rank: "",
        rank_name: "",
        likes_count: item.likes_count,
        layer_thumbnail: item.layer_thumbnail
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

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <Flex height="100vh" width="100vw" direction="row">
      <Box flex="3" borderRight="1px solid #ccc">
        <AdvancedViewport />
      </Box>
      <Box flex="1" overflowY="auto">
        <ArtCardsGrid artPieces={artPieces} />
      </Box>
      <CreateLayerButton onClick={openModal} />
      <CreateCardModal isOpen={isModalOpen} onClose={closeModal} />
    </Flex>
  );
};

export default DesignOffice;
