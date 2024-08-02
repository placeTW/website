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
    .insert([{ design_name: layerName, created_by: userId }]);

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

  const [pixelsError, layerError] = await Promise.all([
    deletePixels,
    deleteLayer,
  ]);

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
    .from("art_tool_colors")
    .select("Color, color_sort")
    .order("color_sort", { ascending: true });

  if (error) {
    console.error("Error fetching colors:", error);
    return [];
  }

  return data;
};

export const saveEditedPixels = async (
  canvas: string,
  pixels: Omit<Pixel, "id">[],
) => {
  try {
    console.log("saveEditedPixels received pixels:", pixels);  // Log received pixels

    // Step 1: Clear existing pixels for the design
    const { error: deleteError } = await supabase
      .from("art_tool_pixels")
      .delete()
      .eq("canvas", canvas);

    if (deleteError) {
      console.error("Error deleting existing pixels:", deleteError);
      throw new Error(deleteError.message);
    }

    // Step 2: Filter out pixels marked as "ClearOnDesign"
    const filteredPixels = pixels.filter((pixel) => pixel.color !== "ClearOnDesign");

    console.log("Filtered Pixels to save:", filteredPixels);

    if (filteredPixels.length === 0) {
      console.log("No pixels to save after filtering ClearOnDesign.");
      return true; // No pixels to save, return early
    }

    // Extra debug logging: Check if any pixel still has an 'id'
    filteredPixels.forEach((pixel, index) => {
      console.log(`Pixel ${index}:`, pixel);
    });

    // Step 3: Insert the remaining pixels
    const { error: insertError } = await supabase
      .from("art_tool_pixels")
      .insert(filteredPixels);

    if (insertError) {
      console.error("Error inserting pixels:", insertError);
      throw new Error(insertError.message);
    }

    return true;
  } catch (error) {
    console.error("Error saving edited pixels:", error);
    throw error;
  }
};







export const uploadThumbnailToSupabase = async (thumbnailBlob: Blob, designId: string) => {
  const { VITE_SUPABASE_URL } = import.meta.env;

  // Step 1: Fetch the current thumbnail URL from the database
  const { data: designData, error: designError } = await supabase
    .from('art_tool_designs')
    .select('design_thumbnail')
    .eq('id', designId)
    .single();

  if (designError) {
    console.error("Error fetching current thumbnail URL:", designError);
    throw new Error(designError.message);
  }

  const oldThumbnailUrl = designData?.design_thumbnail;

  // Step 2: Upload the new thumbnail to Supabase
  const { error: uploadError } = await supabase.storage
    .from('art-tool-thumbnails')
    .upload(`${designId}.png`, thumbnailBlob, {
      upsert: true, // Allow overwriting if the file already exists
      contentType: 'image/png', // Explicitly set the content type
    });

  if (uploadError) {
    console.error("Error uploading thumbnail:", uploadError);
    throw new Error(uploadError.message);
  }

  // Step 3: Get the public URL of the uploaded image using Supabase SDK
  const { data: publicUrlData } = supabase
    .storage
    .from('art-tool-thumbnails')
    .getPublicUrl(`${designId}.png`);

    // Generate a cache-busting URL by appending a timestamp
  const cacheBustedUrl = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;

  // Step 4: Update the thumbnail URL in the database to the cache-busted one
  await updateDesignThumbnail(designId, cacheBustedUrl);

  // Step 5: Delete the old thumbnail from Supabase storage if it exists
  if (oldThumbnailUrl && !oldThumbnailUrl.includes('loading.gif')) {
    // Extract the file path from the old thumbnail URL
    const filePath = oldThumbnailUrl.split(`${VITE_SUPABASE_URL}/storage/v1/object/public/art-tool-thumbnails/`)[1];
    if (filePath) {
      const { error: deleteError } = await supabase.storage
        .from('art-tool-thumbnails')
        .remove([`${filePath}`]);

      if (deleteError) {
        console.error("Error deleting old thumbnail:", deleteError);
        throw new Error(deleteError.message);
      }
    }
  }

  return cacheBustedUrl; // Return the cache-busted URL
};

// Update the design with the new thumbnail URL
export const updateDesignThumbnail = async (designId: string, thumbnailUrl: string) => {
  const { data, error } = await supabase
    .from("art_tool_designs")
    .update({ design_thumbnail: thumbnailUrl })
    .eq("id", designId);

  if (error) {
    console.error("Error updating design thumbnail URL:", error);
    throw new Error(error.message);
  }

  return data;
};
