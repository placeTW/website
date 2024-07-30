import { Spinner } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import ArtCardsGrid from "../component/art-cards-grid";
import { ArtInfo } from "../types/art";

const Gallery = () => {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [artPieces, setArtPieces] = useState<ArtInfo[]>([]);

  const updateArtPieces = (artPieces: ArtInfo[]) => {
    setArtPieces(artPieces);
    setLoading(false);
  };

  useEffect(() => {
    const fetchArtPieces = async (lang: string) => {
      try {
        const jsonPath = `/locales/${lang}/art-pieces.json`;
        const response = await fetch(jsonPath);
        if (!response.ok) {
          throw new Error(`Failed to fetch the json ${jsonPath}`);
        }
        const data = await response.json();
        const artPiecesList: ArtInfo[] = Object.keys(
          data
        ).map((key) => ({ ...data[key], id: key }));
        updateArtPieces(artPiecesList);
      } catch (error) {
        console.error(`Error fetching the json: ${error}`);
        fetchArtPieces("en");
      }
    };

    fetchArtPieces(i18n.resolvedLanguage ?? i18n.languages[0]);
  }, [i18n.languages, i18n.resolvedLanguage]);

  if (loading) {
    return <Spinner size="xl" />;
  } else {
    return <ArtCardsGrid artPieces={artPieces} />;
  }
};

export default Gallery;
