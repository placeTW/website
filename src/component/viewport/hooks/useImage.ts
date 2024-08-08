import { useEffect, useState } from "react";

export const useImage = (src: string): [HTMLImageElement | undefined] => {
  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImage(img);
    };
    img.onerror = () => {
      setImage(undefined);
    };
  }, [src]);

  return [image];
};
