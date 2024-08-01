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

export const saveEditedPixels = async (canvas: string, pixels: Omit<Pixel, "id">[]) => {
  try {
    if (!pixels || pixels.length === 0) {
      console.error("No pixels to save or pixels array is undefined.");
      throw new Error("No pixels to save or pixels array is undefined.");
    }

    // Step 1: Fetch existing pixels for the design
    const { data: existingPixels, error: fetchError } = await supabase
      .from("art_tool_pixels")
      .select("*")
      .eq("canvas", canvas);

    if (fetchError) {
      console.error("Error fetching existing pixels:", fetchError);
      throw new Error(fetchError.message);
    }

    // Step 2: Create a map of the existing pixels by their coordinates, omitting the 'id'
    const existingPixelMap = new Map<string, Omit<Pixel, "id">>(
      (existingPixels || []).map(pixel => [
        `${pixel.x}-${pixel.y}`, 
        { x: pixel.x, y: pixel.y, color: pixel.color, canvas: pixel.canvas } // Ensure 'id' is not included
      ])
    );

    // Step 3: Merge the new pixels into the existing map (overwriting any pixels at the same coordinates)
    pixels.forEach(pixel => {
      existingPixelMap.set(`${pixel.x}-${pixel.y}`, pixel);
    });

    // Step 4: Prepare the merged set of pixels for insertion, ensuring the id is omitted
    const mergedPixels = Array.from(existingPixelMap.values());

    // Log the merged pixels to ensure 'id' is not included
    console.log("Merged Pixels:", mergedPixels);

    // Step 5: Upsert (insert or update) the merged pixels
    const { error: upsertError } = await supabase
      .from("art_tool_pixels")
      .upsert(mergedPixels, { onConflict: "x,y,canvas" }); // Fixing the onConflict type error

    if (upsertError) {
      console.error("Error upserting pixels:", upsertError);
      throw new Error(upsertError.message);
    }

    return true;
  } catch (error) {
    console.error("Error saving edited pixels:", error);
    throw error;
  }
};
