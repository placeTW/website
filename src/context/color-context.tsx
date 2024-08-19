// src/context/color-context.tsx
import React, { createContext, useContext, ReactNode } from "react";
import { databaseFetchColors } from "../api/supabase/database";

// Define the color type
interface Color {
  Color: string;
  color_sort: number | null;
  color_name: string;
}

// Fetch colors immediately and make them available to the entire app
const fetchColors = async () => {
  console.log(`[COLOR-CONTEXT] Fetching colors from database`);

  const fetchedColors = await databaseFetchColors();
  return fetchedColors || [];
};

// Initialize the colors
const initialColors = await fetchColors();
console.log(`[COLOR-CONTEXT] Colors fetched:`, initialColors);

interface ColorContextProps {
  colors: Color[] | null;
}

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
