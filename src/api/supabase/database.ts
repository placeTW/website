import { RealtimeChannel } from "@supabase/supabase-js";
import { CLEAR_ON_DESIGN } from "../../component/viewport/constants";
import { AlertState, Canvas, Color, Design, Pixel } from "../../types/art-tool";
import { RankType, UserType } from "../../types/users"; // Import your types
import { getTopLeftCoords, offsetPixels } from "../../utils/pixelUtils";
import { deleteThumbnail, supabase, uploadThumbnail } from "./index";
import { logSupabaseDatabaseQuery } from "./logging";

// Fetch all users
export const databaseFetchUsers = async (): Promise<UserType[]> => {
  const fetchUsersQuery = await supabase
    .from("art_tool_users")
    .select("*")
    .returns<UserType[]>();

  const { data, error } = logSupabaseDatabaseQuery(
    fetchUsersQuery,
    "fetchUsers",
  );

  if (error) {
    console.error("Error fetching users:", error.message);
    throw new Error(error.message);
  }

  return data || [];
};

// Fetch all ranks
export const databaseFetchRanks = async (): Promise<RankType[]> => {
  const fetchRanksQuery = await supabase
    .from("art_tool_ranks")
    .select("*")
    .returns<RankType[]>();

  const { data, error } = logSupabaseDatabaseQuery(
    fetchRanksQuery,
    "fetchRanks",
  );

  if (error) {
    console.error("Error fetching ranks:", error.message);
    throw new Error(error.message);
  }

  return data || [];
};

// Fetch current user based on user_id
export const databaseFetchCurrentUser = async (
  userId: string,
): Promise<UserType | null> => {
  const fetchUserQuery = await supabase
    .from("art_tool_users")
    .select("*")
    .eq("user_id", userId)
    .single();

  const { data, error } = logSupabaseDatabaseQuery(
    fetchUserQuery,
    "fetchCurrentUser",
  );

  if (error) {
    console.error("Error fetching current user:", error.message);
    return null;
  }

  return data;
};

// Layers-related functions
export const databaseCreateDesign = async (
  layerName: string,
  userId: string,
): Promise<Design[] | null> => {
  const createDesignQuery = await supabase
    .from("art_tool_designs")
    .insert([
      { design_name: layerName, created_by: userId, pixels: [], x: 0, y: 0 },
    ])
    .select()
    .returns<Design[]>();

  const { data, error } = logSupabaseDatabaseQuery(
    createDesignQuery,
    "createDesign",
  );

  if (error) {
    return null;
  }

  return data;
};

export const databaseFetchCanvases = async (): Promise<Canvas[] | null> => {
  const fetchCanvasQuery = await supabase
    .from("art_tool_canvases")
    .select("*")
    .returns<Canvas[]>();

  const { data, error } = logSupabaseDatabaseQuery(
    fetchCanvasQuery,
    "fetchCanvases",
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const databaseFetchCanvas = async (
  canvasId: number,
): Promise<Canvas | null> => {
  const fetchCanvasQuery = await supabase
    .from("art_tool_canvases")
    .select("*")
    .eq("id", canvasId)
    .single();

  const { data, error } = logSupabaseDatabaseQuery(
    fetchCanvasQuery,
    "fetchCanvas",
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const databaseFetchDesigns = async (
  canvasId?: number,
): Promise<Design[] | null> => {
  let fetchDesignsQuery = supabase
    .from("vw_art_tool_design_details")
    .select("*")
    .eq("is_deleted", false);

  if (canvasId) {
    fetchDesignsQuery = fetchDesignsQuery.eq("canvas", canvasId);
  }

  const fetchDesignsResult = await fetchDesignsQuery.returns<Design[]>();

  const { data } = logSupabaseDatabaseQuery(fetchDesignsResult, "fetchDesigns");

  return data;
};

export const databaseFetchDesign = async (
  designId: number,
): Promise<Design | null> => {
  const fetchDesignQuery = await supabase
    .from("vw_art_tool_design_details")
    .select("*")
    .eq("id", designId)
    .single();

  const { data, error } = logSupabaseDatabaseQuery(
    fetchDesignQuery,
    "fetchDesign",
  );

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const databaseDeleteDesign = async (designId: number): Promise<void> => {
  const deleteDesignQuery = await supabase
    .from("art_tool_designs")
    .update({ is_deleted: true })
    .eq("id", designId);

  const { error } = logSupabaseDatabaseQuery(deleteDesignQuery, "deleteDesign");

  await deleteThumbnail(designId);

  if (error) {
    throw new Error(error.message);
  }
};

// Function for liking a design
export const likeDesign = async (
  design: Design,
  userId: string,
): Promise<void> => {
  const updatedLikedByList = design.liked_by.includes(userId)
    ? design.liked_by
    : [...design.liked_by, userId];

  const updateLikesQuery = await supabase
    .from("art_tool_designs")
    .update({ liked_by: updatedLikedByList })
    .eq("id", design.id);

  const { error: updateError } = logSupabaseDatabaseQuery(
    updateLikesQuery,
    "likeDesign",
  );

  if (updateError) {
    throw new Error(updateError.message);
  }
};

// Function for unliking a design
export const unlikeDesign = async (
  design: Design,
  userId: string,
): Promise<void> => {
  const updatedLikedBy = design.liked_by.filter((id: string) => id !== userId);

  const updateLikesQuery = await supabase
    .from("art_tool_designs")
    .update({ liked_by: updatedLikedBy })
    .eq("id", design.id);

  const { error: updateError } = logSupabaseDatabaseQuery(
    updateLikesQuery,
    "unlikeDesign",
  );

  if (updateError) {
    throw new Error(updateError.message);
  }
};

// Function to save edited pixels
export const saveEditedPixels = async (
  design: Design,
  editedPixels: Pixel[],
  newName?: string, // Optional parameter for updating the design name
): Promise<Design> => {
  // Combine the design's pixels with the editedPixels. If a pixel is in both, the edited pixel should replace the design pixel
  const combinedPixels = [...design.pixels, ...editedPixels].reduce(
    (acc, pixel) => {
      const pixelKey = `${pixel.x}-${pixel.y}`;
      acc[pixelKey] = pixel;
      return acc;
    },
    {} as Record<string, Pixel>,
  );

  // Make a list of the combined pixels
  const combinedPixelsList = Object.values(combinedPixels);

  // Remove any pixels that are clear
  const filteredPixels = combinedPixelsList.filter(
    (pixel) => pixel.color !== CLEAR_ON_DESIGN,
  );

  // Get the top left pixel of the design
  const topLeftCoords = getTopLeftCoords(filteredPixels);

  // Copy and offset the pixels to the top left corner
  const pixelsToInsertCopy = offsetPixels(filteredPixels, topLeftCoords);

  // Prepare the update object
  const updateData: Partial<Design> = {
    pixels: pixelsToInsertCopy,
    x: topLeftCoords.x + design.x,
    y: topLeftCoords.y + design.y,
  };

  // If a new name is provided, add it to the update object
  if (newName) {
    updateData.design_name = newName;
  }

  // Update the design with the new pixels and name (if provided)
  const savePixelsQuery = await supabase
    .from("art_tool_designs")
    .update(updateData)
    .eq("id", design.id);

  const { error: updateError } = logSupabaseDatabaseQuery(
    savePixelsQuery,
    "saveEditedPixels",
  );

  if (updateError) {
    throw new Error(updateError.message);
  }

  // Copy the design with the new pixels and name (if updated)
  const updatedDesign = { ...design, ...updateData };

  return updatedDesign;
};

export const uploadDesignThumbnailToSupabase = async (
  thumbnailBlob: Blob,
  design: Design,
): Promise<void> => {
  const { VITE_SUPABASE_URL } = import.meta.env;
  const designId = design.id;
  const oldThumbnailUrl = design.design_thumbnail;

  const newThumbnailUrl = await uploadThumbnail(thumbnailBlob, design);

  // Update the thumbnail URL in the database to the cache-busted one
  await updateDesignThumbnail(designId, newThumbnailUrl);

  // Delete the old thumbnail from Supabase storage if it exists
  if (oldThumbnailUrl && !oldThumbnailUrl.includes("loading.gif")) {
    // Extract the file path from the old thumbnail URL
    const filePath = oldThumbnailUrl.split(
      `${VITE_SUPABASE_URL}/storage/v1/object/public/art-tool-thumbnails/`,
    )[1];
    if (filePath) {
      const { error: deleteError } = await supabase.storage
        .from("art-tool-thumbnails")
        .remove([`${filePath}`]);

      if (deleteError) {
        throw new Error(deleteError.message);
      }
    }
  }
};

// Update the design with the new thumbnail URL
const updateDesignThumbnail = async (
  designId: number,
  thumbnailUrl: string,
): Promise<void> => {
  const updateThumbnailQuery = await supabase
    .from("art_tool_designs")
    .update({ design_thumbnail: thumbnailUrl })
    .eq("id", designId);

  const { error } = logSupabaseDatabaseQuery(
    updateThumbnailQuery,
    "updateDesignThumbnail",
  );

  if (error) {
    throw new Error(error.message);
  }
};

export const updateDesignCanvas = async (
  designId: number,
  canvasId: number,
): Promise<void> => {
  const updateDesignCanvasQuery = await supabase
    .from("art_tool_designs")
    .update({ canvas: canvasId })
    .eq("id", designId);

  const { error } = logSupabaseDatabaseQuery(
    updateDesignCanvasQuery,
    "updateDesignCanvas",
  );

  if (error) {
    throw new Error(error.message);
  }
};

// Function to remove a Supabase channel
export const removeSupabaseChannel = (subscription: RealtimeChannel) => {
  supabase.removeChannel(subscription);
};

// Color-related database functions moved from color-palette-manager.tsx
export const databaseFetchColors = async (): Promise<Color[]> => {
  const fetchColorsQuery = await supabase
    .from("art_tool_colors")
    .select("Color, color_sort, color_name") // Include color_name
    .order("color_sort", { ascending: true })
    .returns<Color[]>();

  const { data } = logSupabaseDatabaseQuery(fetchColorsQuery, "fetchColors");

  return data || [];
};

export const insertColor = async (
  color: string,
  colorName: string,
  sort: number,
): Promise<void> => {
  const insertColorQuery = await supabase.from("art_tool_colors").insert({
    Color: color,
    color_name: colorName,
    color_sort: sort,
  });

  const { error } = logSupabaseDatabaseQuery(insertColorQuery, "insertColor");

  if (error) {
    throw new Error(error.message);
  }
};

export const updateColor = async (
  color: string,
  newColor: string,
  newColorName: string,
): Promise<void> => {
  const updateColorQuery = await supabase
    .from("art_tool_colors")
    .update({ Color: newColor, color_name: newColorName })
    .eq("Color", color);

  const { error } = logSupabaseDatabaseQuery(updateColorQuery, "updateColor");

  if (error) {
    throw new Error(error.message);
  }
};

export const updateColorSortOrder = async (
  updatedColors: Color[],
): Promise<void> => {
  for (let i = 0; i < updatedColors.length; i++) {
    const updateColorSortOrderQuery = await supabase
      .from("art_tool_colors")
      .update({ color_sort: i + 1 })
      .eq("Color", updatedColors[i].Color);

    const { error } = logSupabaseDatabaseQuery(
      updateColorSortOrderQuery,
      "updateColorSortOrder",
    );

    if (error) {
      throw new Error(error.message);
    }
  }
};

export const deleteColor = async (color: string): Promise<void> => {
  const deleteColorQuery = await supabase
    .from("art_tool_colors")
    .delete()
    .eq("Color", color);

  const { error } = logSupabaseDatabaseQuery(deleteColorQuery, "deleteColor");

  if (error) {
    throw new Error(error.message);
  }
};

// Fetch all alert levels

export const fetchAlertLevels = async (): Promise<AlertState[] | null> => {
  try {
    const fetchAlertsQuery = await supabase
      .from("art_tool_alert_state")
      .select("*")
      .order("alert_id", { ascending: true });

    const { data, error } = logSupabaseDatabaseQuery(
      fetchAlertsQuery,
      "fetchAlertLevels",
    );

    if (error) {
      console.error("Supabase fetchAlertLevels error:", error.message, error);
      throw new Error(`fetchAlertLevels: ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error("Error during fetchAlertLevels:", err);
    throw err;
  }
};

export const updateAlertLevel = async (
  alertId: number,
  updates: Partial<AlertState>,
): Promise<void> => {
  try {
    const updateAlertQuery = await supabase
      .from("art_tool_alert_state")
      .update(updates)
      .eq("alert_id", alertId);

    const { error } = logSupabaseDatabaseQuery(
      updateAlertQuery,
      "updateAlertLevel",
    );

    if (error) {
      console.error(
        `Supabase updateAlertLevel error for alert_id ${alertId}:`,
        error.message,
        error,
      );
      throw new Error(`updateAlertLevel: ${error.message}`);
    }
  } catch (err) {
    console.error("Error during updateAlertLevel:", err);
    throw err;
  }
};

export const setActiveAlertLevel = async (
  activeAlertId: number,
): Promise<void> => {
  try {
    const deactivateAlertsQuery = await supabase
      .from("art_tool_alert_state")
      .update({ Active: false })
      .neq("alert_id", activeAlertId);

    const { error: deactivateError } = logSupabaseDatabaseQuery(
      deactivateAlertsQuery,
      "deactivateAlerts",
    );

    if (deactivateError) {
      console.error(
        "Supabase deactivateAlerts error:",
        deactivateError.message,
        deactivateError,
      );
      throw new Error(`deactivateAlerts: ${deactivateError.message}`);
    }

    const activateAlertQuery = await supabase
      .from("art_tool_alert_state")
      .update({ Active: true })
      .eq("alert_id", activeAlertId);

    const { error: activateError } = logSupabaseDatabaseQuery(
      activateAlertQuery,
      "setActiveAlertLevel",
    );

    if (activateError) {
      console.error(
        "Supabase setActiveAlertLevel error:",
        activateError.message,
        activateError,
      );
      throw new Error(`setActiveAlertLevel: ${activateError.message}`);
    }
  } catch (err) {
    console.error("Error during setActiveAlertLevel:", err);
    throw err;
  }
};
