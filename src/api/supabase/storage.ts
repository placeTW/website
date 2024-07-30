import { supabase } from './index';

export const uploadThumbnail = async (file: File): Promise<string | null> => {
  const fileName = `${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from('thumbnails')
    .upload(fileName, file);

  if (error) {
    console.error('Error uploading thumbnail:', error);
    return null;
  }

  const { data } = supabase.storage.from('thumbnails').getPublicUrl(fileName);

  return data?.publicUrl || null;
};
