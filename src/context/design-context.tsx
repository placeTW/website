import React, { createContext, useContext, ReactNode, useState, useEffect, useRef } from "react";
import { Design, Canvas } from "../types/art-tool";
import { supabase } from "../api/supabase";
import { databaseFetchDesigns, databaseFetchCanvases } from "../api/supabase";

// Singleton class for managing subscriptions
class SupabaseSubscriptionManager {
  private static instance: SupabaseSubscriptionManager;
  private designSubscriptionRef: any = null;
  private canvasSubscriptionRef: any = null;

  private constructor() {}

  public static getInstance(): SupabaseSubscriptionManager {
    if (!SupabaseSubscriptionManager.instance) {
      SupabaseSubscriptionManager.instance = new SupabaseSubscriptionManager();
    }
    return SupabaseSubscriptionManager.instance;
  }

  public subscribeToDesignUpdates(setDesigns: React.Dispatch<React.SetStateAction<Design[]>>) {
    if (!this.designSubscriptionRef) {

      this.designSubscriptionRef = supabase
        .channel("public:art_tool_designs")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "art_tool_designs" },
          (payload) => {
            const { eventType, new: newDesignData, old: oldDesignData } = payload;

            setDesigns((prevDesigns) => {
              let updatedDesigns = [...prevDesigns];

              switch (eventType) {
                case "INSERT":
                  updatedDesigns = [...updatedDesigns, newDesignData as Design];
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
                  console.error("[SUBSCRIPTION-MANAGER] Unhandled event type:", eventType);
                  break;
              }

              return updatedDesigns;
            });
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
          } else if (status === "TIMED_OUT" || status === "CLOSED" || status === "CHANNEL_ERROR") {
            this.handleSubscriptionError(this.subscribeToDesignUpdates.bind(this, setDesigns));
          } else {
          }
        });
    }
  }

  public subscribeToCanvasUpdates(setCanvases: React.Dispatch<React.SetStateAction<Canvas[]>>) {
    if (!this.canvasSubscriptionRef) {

      this.canvasSubscriptionRef = supabase
        .channel("public:art_tool_canvases")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "art_tool_canvases" },
          (payload) => {
            const { eventType, new: newCanvasData, old: oldCanvasData } = payload;

            setCanvases((prevCanvases) => {
              let updatedCanvases = [...prevCanvases];

              switch (eventType) {
                case "INSERT":
                  updatedCanvases = [...updatedCanvases, newCanvasData as Canvas];
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
                  console.error("[SUBSCRIPTION-MANAGER] Unhandled event type:", eventType);
                  break;
              }

              return updatedCanvases;
            });
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
          } else if (status === "TIMED_OUT" || status === "CLOSED" || status === "CHANNEL_ERROR") {
            this.handleSubscriptionError(this.subscribeToCanvasUpdates.bind(this, setCanvases));
          } else {
          }
        });
    }
  }

  private handleSubscriptionError(retryFunction: () => void) {
    // Implement a retry mechanism if needed
    setTimeout(retryFunction, 5000); // Retry after 5 seconds
  }

  public unsubscribeAll() {
    if (this.designSubscriptionRef) {
      supabase.removeChannel(this.designSubscriptionRef);
      this.designSubscriptionRef = null;
    }

    if (this.canvasSubscriptionRef) {
      supabase.removeChannel(this.canvasSubscriptionRef);
      this.canvasSubscriptionRef = null;
    }
  }
}

const fetchAllData = async () => {

  const fetchedDesigns = await databaseFetchDesigns();
  const fetchedCanvases = await databaseFetchCanvases();

  return {
    designs: fetchedDesigns || [],
    canvases: fetchedCanvases || [],
  };
};

const initialData = await fetchAllData();

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

  const subscriptionManager = useRef(SupabaseSubscriptionManager.getInstance());

  useEffect(() => {
    subscriptionManager.current.subscribeToDesignUpdates(setDesigns);
    subscriptionManager.current.subscribeToCanvasUpdates(setCanvases);

    return () => {
      subscriptionManager.current.unsubscribeAll();
    };
  }, []);

  return (
    <DesignContext.Provider value={{ designs, canvases, setDesigns, setCanvases }}>
      {children}
    </DesignContext.Provider>
  );
};
