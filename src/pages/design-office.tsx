import { Box, Flex, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { supabase } from "../api/supabase"; // Ensure supabase is imported
import { databaseFetchLayersWithUserDetails } from "../api/supabase/database";
import CreateDesignButton from "../component/art_tool/create-design-button";
import DesignCardsList from "../component/art_tool/design-cards-list";
import AdvancedViewport from "../component/art_tool/advanced-viewport";
import { DesignInfo } from "../types/art-tool";

const DesignOffice: React.FC = () => {
  const [designs, setDesigns] = useState<DesignInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLayersWithUserDetails = async () => {
    try {
      const data = await databaseFetchLayersWithUserDetails();
      const formattedData = data.map((item: any) => ({
        id: item.id.toString(),
        layer_name: item.layer_name,
        created_by_user_id: item.created_by_user_id,
        handle: item.art_tool_users.handle || "",
        rank: item.art_tool_users.rank || "",
        likes_count: item.likes_count,
        layer_thumbnail: item.layer_thumbnail,
      }));
      setDesigns(formattedData);
    } catch (error) {
      console.error("Error fetching layers with user details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLayersWithUserDetails();

    const subscription = supabase
      .channel("art_tool_layers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "art_tool_layers" },
        () => {
          fetchLayersWithUserDetails(); // refetch data on insert
        }
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
        <DesignCardsList designs={designs} />
      </Box>
      <Box position="absolute" bottom="30px" right="30px" zIndex="1000">
        <CreateDesignButton />
      </Box>
    </Flex>
  );
};

export default DesignOffice;
