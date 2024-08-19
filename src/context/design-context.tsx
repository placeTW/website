import React, { createContext, useContext, ReactNode } from "react";
import { Design, Canvas } from "../types/art-tool";
import { databaseFetchDesigns, databaseFetchCanvases } from "../api/supabase";


// Fetch all data immediately and make it available to the entire app
const fetchAllData = async () => {
  console.log(`[DESIGN-CONTEXT] Fetching all data from database`);

  const fetchedDesigns = await databaseFetchDesigns();
  const fetchedCanvases = await databaseFetchCanvases();

  return {
    designs: fetchedDesigns || [],
    canvases: fetchedCanvases || [],
  };
};

// Initialize the data
const initialData = await fetchAllData();
console.log(`[DESIGN-CONTEXT] Data fetched:`, initialData);

interface DesignContextProps {
  designs: Design[] | null;
  canvases: Canvas[] | null;
}

// Create the context with initial values
const DesignContext = createContext<DesignContextProps>({
  designs: initialData.designs,
  canvases: initialData.canvases,
});

export const useDesignContext = () => {
  const context = useContext(DesignContext);
  if (context === undefined) {
    throw new Error("useDesignContext must be used within a DesignContext.Provider");
  }
  return context;
};

interface DesignProviderProps {
  children: ReactNode;
}

export const DesignProvider: React.FC<DesignProviderProps> = ({ children }) => {
  return (
    <DesignContext.Provider value={initialData}>
      {children}
    </DesignContext.Provider>
  );
};
