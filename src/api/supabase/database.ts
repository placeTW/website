import { supabase } from "./index";
// Layers-related functions
export const databaseCreateLayer = async (
  layerName: string,
  userId: string,
) => {
  const { data, error } = await supabase
    .from("art_tool_layers")
    .insert([
      { layer_name: layerName, created_by_user_id: userId, likes_count: 0 },
    ]);

  if (error) {
    console.error("Error creating layer:", error);
    throw new Error(error.message);
  }

  return data;
};

export const databaseFetchLayersWithUserDetails = async () => {
  const { data, error } = await supabase.from("art_tool_layers").select(`
      id,
      created_at,
      layer_name,
      layer_thumbnail,
      likes_count,
      created_by_user_id,
      art_tool_users:art_tool_users (
        handle,
        rank
      )
    `);

  if (error) {
    throw new Error(error.message);
  }
  return data;
};

export const databaseFetchPixels = async (canvas: string) => {
  const { data, error } = await supabase
    .from("art_tool_pixels")
    .select("*")
    .eq("canvas", canvas);
  if (error) {
    console.error("Error fetching pixel data:", error);
  } else {
    console.log("Fetched pixels:", data);
    return data;
  }
};

export const databaseFetchAlertLevel = async () => {
  const { data, error } = await supabase
    .from("art_tool_alert_state")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Error fetching alert level:", error);
    return null;
  }

  return data;
};

export const databaseUpdateAlertLevel = async (level: number) => {
  const { error } = await supabase
    .from("art_tool_alert_state")
    .update({ state: level })
    .eq("id", 1);

  if (error) {
    throw new Error(error.message);
  }
};

export const databaseDeleteLayerAndPixels = async (layerName: string) => {
  const deletePixels = supabase
    .from("art_tool_pixels")
    .delete()
    .eq("canvas", layerName);

  const deleteLayer = supabase
    .from("art_tool_layers")
    .delete()
    .eq("layer_name", layerName);

  const [pixelsError, layerError] = await Promise.all([deletePixels, deleteLayer]);

  if (pixelsError.error) {
    console.error("Error deleting pixels:", pixelsError.error);
    throw new Error(pixelsError.error.message);
  }

  if (layerError.error) {
    console.error("Error deleting layer:", layerError.error);
    throw new Error(layerError.error.message);
  }

  return true;
};
