import { Spinner } from "@chakra-ui/react";
import React from "react";
import { useTranslation } from "react-i18next";
import ArtCards from "../component/art-cards";
import { ArtInfo } from "../types/art";

const Gallery = () => {
  const { i18n } = useTranslation();
  const [loading, setLoading] = React.useState(true);
  const [artPieces, setArtPieces] = React.useState<ArtInfo[]>([]);

  const updateArtPieces = (artPieces: ArtInfo[]) => {
    setArtPieces(artPieces);
    setLoading(false);
  };

  React.useEffect(() => {
    const fetchArtPieces = async (lang: string) => {
      try {
        const jsonPath = `/locales/${lang}/art-pieces.json`;
        const response = await fetch(jsonPath);
        if (!response.ok) {
          throw new Error(`Failed to fetch the json ${jsonPath}`);
        }
        const data = await response.json();
        updateArtPieces(data);
      } catch (error) {
        console.error(`Error fetching the json: ${error}`);
        updateArtPieces([]);
      }
    };

    fetchArtPieces(i18n.language);
  }, [i18n.language]);

  if (loading) {
    return <Spinner size="xl" />;
  } else {
    return <ArtCards artPieces={artPieces} />;
  }
};

export default Gallery;
