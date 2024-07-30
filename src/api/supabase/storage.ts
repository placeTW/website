import { supabase } from './index';

export const uploadThumbnail = async (file: File): Promise<string | null> => {
  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('thumbnails')
    .upload(fileName, file);

  if (error) {
    console.error('Error uploading thumbnail:', error);
    return null;
  }

  const { publicURL } = supabase.storage.from('thumbnails').getPublicUrl(fileName);

  return publicURL;
};
