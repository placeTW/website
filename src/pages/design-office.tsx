import { Box, Flex, Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { supabase } from "../api/supabase"; // Ensure supabase is imported
import { databaseFetchDesignsWithUserDetails } from "../api/supabase/database";
import CreateDesignButton from "../component/art_tool/create-design-button";
import DesignCardsList from "../component/art_tool/design-cards-list";
import AdvancedViewport from "../component/art_tool/advanced-viewport";
import { DesignInfo } from "../types/art-tool";

const DesignOffice: React.FC = () => {
  const [designs, setDesigns] = useState<DesignInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLayersWithUserDetails = async () => {
    try {
      const data = await databaseFetchDesignsWithUserDetails();
      const formattedData = data.map((item: any) => ({
        id: item.id.toString(),
        design_name: item.design_name,
        created_by: item.created_by,
        handle: item.art_tool_users.handle || "",
        rank: item.art_tool_users.rank || "",
        rank_name: item.art_tool_users.rank_name || "", // Add rank_name here
        liked_by: item.liked_by,
        design_thumbnail: item.design_thumbnail,
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
      .channel("art_tool_designs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "art_tool_designs" },
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
      <Box flex="1"  border="1px solid #ccc">
        <AdvancedViewport />
      </Box>
      <Box w="350px" overflowY="auto">
        <DesignCardsList designs={designs} />
        <Box h="100px" />
      </Box>
      <Box position="absolute" bottom="30px" right="30px" zIndex="1000">
        <CreateDesignButton />
      </Box>
    </Flex>
  );
};

export default DesignOffice;
