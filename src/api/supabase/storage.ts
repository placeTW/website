import { Design } from "../../types/art-tool";
import { supabase } from "./index";

const logSupabaseCalls = import.meta.env.LOG_SUPABASE_CALLS ?? false;

export const uploadThumbnail = async (
  thumbnailBlob: Blob,
  design: Design,
): Promise<string> => {
  // Upload the new thumbnail to Supabase
  const { data, error: uploadError } = await supabase.storage
    .from("art-tool-thumbnails")
    .upload(`${design.id}.png`, thumbnailBlob, {
      upsert: true, // Allow overwriting if the file already exists
      contentType: "image/png", // Explicitly set the content type
    });

  if (uploadError) {
    if (logSupabaseCalls) {
      console.error(
        `[SUPABASE ERROR] Failed to upload thumbnail for design ${design.id}: ${uploadError.message}`,
      );
    }
    throw new Error(uploadError.message);
  }

  // Get the public URL of the uploaded image using Supabase SDK
  const { data: publicUrlData } = supabase.storage
    .from("art-tool-thumbnails")
    .getPublicUrl(data.path);

  // Generate a cache-busting URL by appending a timestamp
  const cacheBustedUrl = `${publicUrlData.publicUrl}?t=${new Date().getTime()}`;

  return cacheBustedUrl;
};
