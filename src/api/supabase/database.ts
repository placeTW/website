import { supabase } from "./index";

interface Pixel {
  id: number;
  x: number;
  y: number;
  color: string;
  canvas: string;
}

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

// Function for liking a design
export const likeDesign = async (designId: string, userId: string) => {
  const { data, error: fetchError } = await supabase
    .from("art_tool_designs")
    .select("liked_by")
    .eq("id", designId)
    .single();

  if (fetchError) {
    console.error("Error fetching liked_by array:", fetchError);
    throw new Error(fetchError.message);
  }

  const updatedLikedBy = data.liked_by.includes(userId)
    ? data.liked_by
    : [...data.liked_by, userId];

  const { error: updateError } = await supabase
    .from("art_tool_designs")
    .update({ liked_by: updatedLikedBy })
    .eq("id", designId);

  if (updateError) {
    console.error("Error liking design:", updateError);
    throw new Error(updateError.message);
  }

  return true;
};

// Function for unliking a design
export const unlikeDesign = async (designId: string, userId: string) => {
  const { data, error: fetchError } = await supabase
    .from("art_tool_designs")
    .select("liked_by")
    .eq("id", designId)
    .single();

  if (fetchError) {
    console.error("Error fetching liked_by array:", fetchError);
    throw new Error(fetchError.message);
  }

  const updatedLikedBy = data.liked_by.filter((id: string) => id !== userId);

  const { error: updateError } = await supabase
    .from("art_tool_designs")
    .update({ liked_by: updatedLikedBy })
    .eq("id", designId);

  if (updateError) {
    console.error("Error unliking design:", updateError);
    throw new Error(updateError.message);
  }

  return true;
};

export const databaseFetchColors = async () => {
  const { data, error } = await supabase
    .from("art_tools_colours")
    .select("color_code");

  if (error) {
    console.error("Error fetching colors:", error);
    return [];
  }

  return data.map((color) => color.color_code);
};

// Function to save edited pixels to the database
export const saveEditedPixels = async (canvas: string, pixels: Pixel[]) => {
  try {
    if (!pixels || pixels.length === 0) {
      console.error("No pixels to save or pixels array is undefined.");
      throw new Error("No pixels to save or pixels array is undefined.");
    }

    // First, delete existing pixels for the design
    const { error: deleteError } = await supabase
      .from("art_tool_pixels")
      .delete()
      .eq("canvas", canvas);

    if (deleteError) {
      console.error("Error deleting existing pixels:", deleteError);
      throw new Error(deleteError.message);
    }

    // Prepare the new pixel data
    const preparedPixels = pixels.map((pixel) => ({
      x: pixel.x,
      y: pixel.y,
      color: pixel.color,
      canvas: canvas, // Ensure the correct canvas name is associated
    }));

    console.log("Prepared Pixels:", preparedPixels); // Log to verify the data structure

    // Insert new pixels
    const { error: insertError } = await supabase
      .from("art_tool_pixels")
      .insert(preparedPixels);

    if (insertError) {
      console.error("Error inserting new pixels:", insertError);
      throw new Error(insertError.message);
    }

    return true;
  } catch (error) {
    console.error("Error saving edited pixels:", error);
    throw error;
  }
};