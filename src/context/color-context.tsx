import React, { createContext, useContext, ReactNode } from "react";
import { databaseFetchColors } from "../api/supabase";
import { useToast } from "@chakra-ui/react";

interface Color {
  Color: string;
  color_sort: number | null;
  color_name: string;
}

interface ColorContextProps {
  colors: Color[] | null;
}

// Fetch colors data immediately and make it available to the entire app
const fetchAllColors = async (): Promise<Color[]> => {
  console.log(`[COLOR-CONTEXT] Fetching colors from database`);

  const fetchedColors = await databaseFetchColors();

  const specialColors = [
    {
      Color: "#00000000", // Transparent color for clearing on design
      color_sort: null,
      color_name: "Clear on Design",
    },
    {
      Color: "#FFFFFF00", // Transparent color for clearing on main
      color_sort: null,
      color_name: "Clear on Main",
    },
  ];

  return [...(fetchedColors || []), ...specialColors];
};

// Initialize the data
const initialColors = await fetchAllColors();
console.log(`[COLOR-CONTEXT] Colors fetched:`, initialColors);

// Create the context with initial values
const ColorContext = createContext<ColorContextProps>({
  colors: initialColors,
});

export const useColorContext = () => {
  const context = useContext(ColorContext);
  if (context === undefined) {
    throw new Error("useColorContext must be used within a ColorContext.Provider");
  }
  return context;
};

interface ColorProviderProps {
  children: ReactNode;
}

export const ColorProvider: React.FC<ColorProviderProps> = ({ children }) => {
  return (
    <ColorContext.Provider value={{ colors: initialColors }}>
      {children}
    </ColorContext.Provider>
  );
};
