import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { Design, Canvas } from "../types/art-tool";
import { supabase } from "../api/supabase";
import { databaseFetchDesigns, databaseFetchCanvases } from "../api/supabase";

// Fetch all data initially and make it available to the entire app
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
  designs: Design[];
  canvases: Canvas[];
  setDesigns: React.Dispatch<React.SetStateAction<Design[]>>;
  setCanvases: React.Dispatch<React.SetStateAction<Canvas[]>>;
}

const DesignContext = createContext<DesignContextProps>({
  designs: initialData.designs,
  canvases: initialData.canvases,
  setDesigns: () => {},
  setCanvases: () => {},
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
  const [designs, setDesigns] = useState<Design[]>(initialData.designs);
  const [canvases, setCanvases] = useState<Canvas[]>(initialData.canvases);

  useEffect(() => {
    console.log("[DESIGN-CONTEXT] Subscribing to real-time design updates");

    const designSubscription = supabase
      .channel("public:art_tool_designs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "art_tool_designs" },
        (payload) => {
          const { eventType, new: newDesignData, old: oldDesignData } = payload;
          console.log("[DESIGN-CONTEXT] Received update event:", eventType, newDesignData, oldDesignData);

          if (!newDesignData || typeof newDesignData !== 'object') {
            console.error("[DESIGN-CONTEXT] Invalid design data received:", newDesignData);
            return;
          }

          setDesigns((prevDesigns) => {
            let updatedDesigns = [...prevDesigns];

            switch (eventType) {
              case "INSERT":
                updatedDesigns.push(newDesignData as Design);
                break;
              case "UPDATE":
                updatedDesigns = updatedDesigns.map((design) =>
                  design.id === oldDesignData.id ? (newDesignData as Design) : design
                );
                break;
              case "DELETE":
                updatedDesigns = updatedDesigns.filter(
                  (design) => design.id !== oldDesignData.id
                );
                break;
              default:
                console.error("[DESIGN-CONTEXT] Unhandled event type:", eventType);
                break;
            }

            console.log("[DESIGN-CONTEXT] Updated designs array:", updatedDesigns);
            return updatedDesigns;
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[DESIGN-CONTEXT] Successfully subscribed to design updates");
        } else if (status === "TIMED_OUT") {
          console.error("[DESIGN-CONTEXT] Subscription to design updates timed out");
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          console.error(`[DESIGN-CONTEXT] Subscription error: ${status}`);
        } else {
          console.log("[DESIGN-CONTEXT] Subscription status:", status);
        }
      });

    console.log("[DESIGN-CONTEXT] Subscribing to real-time canvas updates");

    const canvasSubscription = supabase
      .channel("public:art_tool_canvases")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "art_tool_canvases" },
        (payload) => {
          const { eventType, new: newCanvasData, old: oldCanvasData } = payload;
          console.log("[DESIGN-CONTEXT] Received update event:", eventType, newCanvasData, oldCanvasData);

          if (!newCanvasData || typeof newCanvasData !== 'object') {
            console.error("[DESIGN-CONTEXT] Invalid canvas data received:", newCanvasData);
            return;
          }

          setCanvases((prevCanvases) => {
            let updatedCanvases = [...prevCanvases];

            switch (eventType) {
              case "INSERT":
                updatedCanvases.push(newCanvasData as Canvas);
                break;
              case "UPDATE":
                updatedCanvases = updatedCanvases.map((canvas) =>
                  canvas.id === oldCanvasData.id ? (newCanvasData as Canvas) : canvas
                );
                break;
              case "DELETE":
                updatedCanvases = updatedCanvases.filter(
                  (canvas) => canvas.id !== oldCanvasData.id
                );
                break;
              default:
                console.error("[DESIGN-CONTEXT] Unhandled event type:", eventType);
                break;
            }

            console.log("[DESIGN-CONTEXT] Updated canvases array:", updatedCanvases);
            return updatedCanvases;
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[DESIGN-CONTEXT] Successfully subscribed to canvas updates");
        } else if (status === "TIMED_OUT") {
          console.error("[DESIGN-CONTEXT] Subscription to canvas updates timed out");
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          console.error(`[DESIGN-CONTEXT] Subscription error: ${status}`);
        } else {
          console.log("[DESIGN-CONTEXT] Subscription status:", status);
        }
      });

    return () => {
      supabase.removeChannel(designSubscription);
      supabase.removeChannel(canvasSubscription);
    };
  }, []);

  return (
    <DesignContext.Provider value={{ designs, canvases, setDesigns, setCanvases }}>
      {children}
    </DesignContext.Provider>
  );
};
