import { RealtimeChannel } from "@supabase/supabase-js";
import { AlertState, Canvas, Color, Design, Pixel } from "../../types/art-tool";
import { getTopLeftCoords, offsetPixels } from "../../utils/getTopLeftPixel";
import { supabase, uploadThumbnail } from "./index";
import { logSupabaseDatabaseQuery } from "./logging";

// Layers-related functions
export const databaseCreateDesign = async (
  layerName: string,
  userId: string,
): Promise<boolean> => {
  const createDesignQuery = await supabase
    .from("art_tool_designs")
    .insert([
      { design_name: layerName, created_by: userId, pixels: [], x: 0, y: 0 },
    ]);

  const { error } = logSupabaseDatabaseQuery(createDesignQuery, "createDesign");

  if (error) {
    return false;
  }

  return true;
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

export const databaseFetchDesigns = async (): Promise<Design[] | null> => {
  const fetchDesignsQuery = await supabase
    .from("art_tool_designs")
    .select(
      `
    id,
    created_at,
    design_name,
    design_thumbnail,
    liked_by,
    created_by,
    art_tool_users:created_by (
      handle,
      rank
    ),
    pixels,
    x,
    y,
    canvas,
    art_tool_canvases:canvas (
      canvas_name
    ),
    status
  `,
    )
    .eq("is_deleted", false)
    .returns<Design[]>();

  const { data } = logSupabaseDatabaseQuery(fetchDesignsQuery, "fetchDesigns");

  return data;
};

export const databaseFetchAlertLevel = async (): Promise<AlertState | null> => {
  const fetchAlertLevelQuery = await supabase
    .from("art_tool_alert_state")
    .select("*")
    .eq("id", 1)
    .single<AlertState>();

  const { data } = logSupabaseDatabaseQuery(
    fetchAlertLevelQuery,
    "fetchAlertLevel",
  );

  return data;
};

export const databaseUpdateAlertLevel = async (
  level: number,
): Promise<boolean> => {
  const updateAlertLevelQuery = await supabase
    .from("art_tool_alert_state")
    .update({ state: level })
    .eq("id", 1);

  const { error } = logSupabaseDatabaseQuery(
    updateAlertLevelQuery,
    "updateAlertLevel",
  );

  if (error) {
    return false;
  }

  return true;
};

export const databaseDeleteDesign = async (designId: number): Promise<void> => {
  const deleteDesignQuery = await supabase
    .from("art_tool_designs")
    .update({ is_deleted: true })
    .eq("id", designId);

  const { error } = logSupabaseDatabaseQuery(deleteDesignQuery, "deleteDesign");

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
  pixels: Pixel[],
): Promise<Design> => {
  // Get the top left pixel of the design
  const topLeftCoords = getTopLeftCoords(pixels);

  // Copy and offset the pixels to the top left corner
  const pixelsToInsertCopy = offsetPixels(pixels, topLeftCoords);

  //Update the design with the new pixels
  const savePixelsQuery = await supabase
    .from("art_tool_designs")
    .update({
      pixels: pixelsToInsertCopy,
      x: topLeftCoords.x + design.x,
      y: topLeftCoords.y + design.y,
    })
    .eq("id", design.id);

  const { error: updateError } = logSupabaseDatabaseQuery(
    savePixelsQuery,
    "saveEditedPixels",
  );

  if (updateError) {
    throw new Error(updateError.message);
  }

  // Copy the design with the new pixels
  const updatedDesign = { ...design, pixels: pixelsToInsertCopy };

  return updatedDesign;
};

export const uploaDesignThumbnailToSupabase = async (
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
export const databaseFetchAlerts = async (): Promise<AlertState[] | null> => {
  const fetchAlertsQuery = await supabase
    .from("art_tool_alert_state")
    .select("*")
    .order("alert_id", { ascending: true });

  const { data, error } = logSupabaseDatabaseQuery(fetchAlertsQuery, "fetchAlerts");

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

// Update an alert level (name, message, or active status)
export const databaseUpdateAlert = async (
  alertId: number,
  updates: Partial<AlertState>,
): Promise<void> => {
  const updateAlertQuery = await supabase
    .from("art_tool_alert_state")
    .update(updates)
    .eq("alert_id", alertId);

  const { error } = logSupabaseDatabaseQuery(updateAlertQuery, "updateAlert");

  if (error) {
    console.error("Supabase update error:", error); // Log the Supabase error
    throw new Error(error.message);
  }
};

// Set an active alert level and deactivate others
export const databaseSetActiveAlert = async (
  activeAlertId: number
): Promise<void> => {
  // Deactivate all alerts
  const deactivateAlertsQuery = await supabase
    .from("art_tool_alert_state")
    .update({ Active: false })
    .neq("alert_id", activeAlertId);

  const { error: deactivateError } = logSupabaseDatabaseQuery(
    deactivateAlertsQuery,
    "deactivateAlerts"
  );

  if (deactivateError) {
    throw new Error(deactivateError.message);
  }

  // Activate the selected alert
  const activateAlertQuery = await supabase
    .from("art_tool_alert_state")
    .update({ Active: true })
    .eq("alert_id", activeAlertId);

  const { error: activateError } = logSupabaseDatabaseQuery(
    activateAlertQuery,
    "activateAlert"
  );

  if (activateError) {
    throw new Error(activateError.message);
  }
};