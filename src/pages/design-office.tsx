import { Box, Flex, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { supabase } from "../api/supabase";
import AdvancedViewport from "../component/advanced-viewport";
import ArtCardsGrid from "../component/art_tool/design-cards-grid";
import CreateLayerButton from "../component/create-layer-button";
import { ArtInfo } from "../types/art";

const DesignOffice: React.FC = () => {
  const [artPieces, setArtPieces] = useState<ArtInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArtPieces = async () => {
    const { data, error } = await supabase.from("art_tool_layers").select("*");

    if (error) {
      console.error("Error fetching art pieces:", error);
    } else {
      const userIds = data.map((item: any) => item.created_by_user_id);
      const { data: users, error: userError } = await supabase
        .from("art_tool_users")
        .select("*")
        .in("user_id", userIds);

      if (userError) {
        console.error("Error fetching user data:", userError);
      } else {
        const formattedData = data.map((item: any) => {
          const user = users.find(
            (u: any) => u.user_id === item.created_by_user_id,
          );
          return {
            id: item.id.toString(),
            layer_name: item.layer_name,
            created_by_user_id: item.created_by_user_id,
            handle: user?.handle || "",
            rank: user?.rank || "",
            rank_name: user?.rank_name || "",
            likes_count: item.likes_count,
            layer_thumbnail: item.layer_thumbnail,
          };
        });
        setArtPieces(formattedData);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchArtPieces();

    const subscription = supabase
      .channel("art_tool_layers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "art_tool_layers" },
        () => {
          fetchArtPieces(); // refetch data on insert
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (loading) {
    return <Spinner size="xl" />;
  }

  return (
    <Flex height="calc(100vh - 80px)" width="100vw" direction="row">
      <Box flex="3" borderRight="1px solid #ccc">
        <AdvancedViewport />
      </Box>
      <Box flex="1" overflowY="auto" position="relative">
        <ArtCardsGrid artPieces={artPieces} />
      </Box>
      <Box position="fixed" bottom="100px" right="30px" zIndex="1000">
        <CreateLayerButton />
      </Box>
    </Flex>
  );
};

export default DesignOffice;
