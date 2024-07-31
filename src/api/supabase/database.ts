import { supabase } from "./index";

// Layers-related functions
export const databaseCreateDesign = async (
  layerName: string,
  userId: string,
) => {
  const { data, error } = await supabase
    .from("art_tool_designs")
    .insert([
      { design_name: layerName, created_by: userId },
    ]);

  if (error) {
    console.error("Error creating layer:", error);
    throw new Error(error.message);
  }

  return data;
};

export const databaseFetchDesignsWithUserDetails = async () => {
  const { data, error } = await supabase.from("art_tool_designs").select(`
    id,
    created_at,
    design_name,
    design_thumbnail,
    liked_by,
    created_by,
    art_tool_users:created_by (
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
    .from("art_tool_designs")
    .delete()
    .eq("design_name", layerName);

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
