import { Box, Flex, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { supabase } from "../api/supabase";
import AdvancedViewport from "../component/art_tool/advanced-viewport";
import CreateDesignButton from "../component/art_tool/create-design-button";
import DesignCardsGrid from "../component/art_tool/design-cards-list";
import { DesignInfo } from "../types/art-tool";

const DesignOffice: React.FC = () => {
  const [artPieces, setArtPieces] = useState<DesignInfo[]>([]);
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
    <Flex height="calc(100vh - 80px)" position="relative" direction="row">
      <Box flex="1">
        <AdvancedViewport />
      </Box>
      <Box w="350px" overflowY="auto" borderLeft="1px solid #ccc">
        <DesignCardsGrid designs={artPieces} />
      </Box>
      <Box position="absolute" bottom="30px" right="30px" zIndex="1000">
        <CreateDesignButton />
      </Box>
    </Flex>
  );
};

export default DesignOffice;
