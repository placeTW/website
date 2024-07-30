import { supabase } from "./index";

export const createLayer = async (layerName: string, userId: string) => {
  const { data, error } = await supabase
    .from("art_tool_layers")
    .insert([
      { layer_name: layerName, created_by_user_id: userId, likes_count: 0 }
    ]);

  if (error) {
    console.error("Error creating layer:", error);
    throw new Error(error.message);
  }

  return data;
};
