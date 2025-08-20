import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { supabase } from "../api/supabase";
import { databaseFetchColors } from "../api/supabase/database";

// Define the color type
interface Color {
  Color: string;
  color_name: string;
  color_sort: number | null;
}

// Fetch colors immediately and make them available to the entire app
const fetchColors = async (): Promise<Color[]> => {
  const fetchedColors = await databaseFetchColors();
  if (fetchedColors) {
    return fetchedColors.map((color) => ({
      Color: color.Color,
      color_name: color.color_name,
      color_sort: color.color_sort,
    }));
  }
  return [];
};

const getColorsMap = (colors: Color[]): Map<string, Color> => {
  const map = new Map()
  colors.forEach(color => map.set(color.Color, color))
  return map
}

// Initialize the colors
const initialColors: Color[] = await fetchColors();

interface ColorContextProps {
  colors: Color[];
  colorsMap: Map<string, Color>;
  setColors: React.Dispatch<React.SetStateAction<Color[]>>;
}

const ColorContext = createContext<ColorContextProps>({
  colors: initialColors,
  colorsMap: getColorsMap(initialColors),
  setColors: () => {},
});

export const useColorContext = () => {
  const context = useContext(ColorContext);
  if (context === undefined) {
    throw new Error(
      "useColorContext must be used within a ColorContext.Provider",
    );
  }
  return context;
};

interface ColorProviderProps {
  children: ReactNode;
}

export const ColorProvider: React.FC<ColorProviderProps> = ({ children }) => {
  const [colors, setColors] = useState<Color[]>(initialColors);
  const [colorsMap, setColorsMap] = useState<Map<string, Color>>(new Map());

  useEffect(() => {
    const subscription = supabase
      .channel("public:art_tool_colors")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "art_tool_colors" },
        (payload) => {
          const { eventType, new: newColorData, old: oldColorData } = payload;

          setColors((prevColors) => {
            let updatedColors = [...prevColors];

            switch (eventType) {
              case "INSERT":
                updatedColors.push({
                  Color: newColorData.Color,
                  color_name: newColorData.color_name,
                  color_sort: newColorData.color_sort,
                });
                break;
              case "UPDATE":
                updatedColors = updatedColors.map((color) =>
                  color.Color === oldColorData.Color
                    ? {
                        Color: newColorData.Color,
                        color_name: newColorData.color_name,
                        color_sort: newColorData.color_sort,
                      }
                    : color,
                );
                break;
              case "DELETE":
                updatedColors = updatedColors.filter(
                  (color) => color.Color !== oldColorData.Color,
                );
                break;
              default:
                break;
            }

            // Ensure colors are sorted by color_sort after every update
            updatedColors.sort(
              (a, b) => (a.color_sort ?? 0) - (b.color_sort ?? 0),
            );

            return updatedColors;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    setColorsMap(getColorsMap(colors))
  }, [colors])

  return (
    <ColorContext.Provider value={{ colors, colorsMap, setColors }}>
      {children}
    </ColorContext.Provider>
  );
};
