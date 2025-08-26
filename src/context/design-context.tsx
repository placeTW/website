import { RealtimeChannel } from "@supabase/supabase-js";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  databaseFetchCanvases,
  databaseFetchDesigns,
  supabase,
} from "../api/supabase";
import { Canvas, Design } from "../types/art-tool";
import { useUserContext } from "./user-context";
import { UserType, RankType } from "../types/users";

// Helper function to enrich raw design data with user/rank/canvas information
const enrichDesignData = (
  rawDesign: Partial<Design>, 
  users: UserType[], 
  ranks: RankType[], 
  canvases: Canvas[]
): Design => {
  const user = users.find(u => u.user_id === rawDesign.created_by);
  const rank = ranks.find(r => r.rank_id === user?.rank);
  const canvas = canvases.find(c => c.id === rawDesign.canvas);
  
  return {
    id: rawDesign.id!,
    design_name: rawDesign.design_name || '',
    design_thumbnail: rawDesign.design_thumbnail || '',
    created_by: rawDesign.created_by || '',
    rank_name: rank?.rank_name || '',
    user_handle: user?.handle || '',
    liked_by: rawDesign.liked_by || [],
    pixels: rawDesign.pixels || [],
    x: rawDesign.x || 0,
    y: rawDesign.y || 0,
    canvas: rawDesign.canvas,
    canvas_name: canvas?.canvas_name || '',
    status: rawDesign.status || 0,
  };
};

// Singleton class for managing subscriptions
class SupabaseSubscriptionManager {
  private static instance: SupabaseSubscriptionManager;
  private designSubscriptionRef: RealtimeChannel | null = null;
  private canvasSubscriptionRef: RealtimeChannel | null = null;

  private constructor() {}

  public static getInstance(): SupabaseSubscriptionManager {
    if (!SupabaseSubscriptionManager.instance) {
      SupabaseSubscriptionManager.instance = new SupabaseSubscriptionManager();
    }
    return SupabaseSubscriptionManager.instance;
  }

  public subscribeToDesignUpdates(
    setDesigns: React.Dispatch<React.SetStateAction<Design[]>>,
    users: UserType[],
    ranks: RankType[], 
    canvases: Canvas[]
  ) {
    if (!this.designSubscriptionRef) {
      this.designSubscriptionRef = supabase
        .channel("public:art_tool_designs")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "art_tool_designs" },
          (payload) => {
            const {
              eventType,
              new: newDesignData,
              old: oldDesignData,
            } = payload;

            if (eventType === "DELETE") {
              setDesigns((prevDesigns) =>
                prevDesigns.filter((design) => design.id !== oldDesignData.id),
              );
              return;
            }

            // Enrich the design data using context data instead of database fetch
            const newDesign = enrichDesignData(newDesignData, users, ranks, canvases);

            setDesigns((prevDesigns) => {
              let updatedDesigns = [...prevDesigns];

              switch (eventType) {
                case "INSERT":
                  updatedDesigns = [...updatedDesigns, newDesign];
                  break;
                case "UPDATE":
                  updatedDesigns = updatedDesigns.map((design) =>
                    design.id === oldDesignData.id ? newDesign : design,
                  );
                  break;
                default:
                  console.error(
                    "[SUBSCRIPTION-MANAGER] Unhandled event type:",
                    eventType,
                  );
                  break;
              }

              return updatedDesigns;
            });
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            // Do nothing
            return;
          }
          if (
            status === "TIMED_OUT" ||
            status === "CLOSED" ||
            status === "CHANNEL_ERROR"
          ) {
            this.handleSubscriptionError(
              this.subscribeToDesignUpdates.bind(this, setDesigns, users, ranks, canvases),
            );
            return;
          }
        });
    }
  }

  public subscribeToCanvasUpdates(
    setCanvases: React.Dispatch<React.SetStateAction<Canvas[]>>,
  ) {
    if (!this.canvasSubscriptionRef) {
      this.canvasSubscriptionRef = supabase
        .channel("public:art_tool_canvases")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "art_tool_canvases" },
          (payload) => {
            const {
              eventType,
              new: newCanvasData,
              old: oldCanvasData,
            } = payload;

            setCanvases((prevCanvases) => {
              let updatedCanvases = [...prevCanvases];

              switch (eventType) {
                case "INSERT":
                  updatedCanvases = [
                    ...updatedCanvases,
                    newCanvasData as Canvas,
                  ];
                  break;
                case "UPDATE":
                  updatedCanvases = updatedCanvases.map((canvas) =>
                    canvas.id === oldCanvasData.id
                      ? (newCanvasData as Canvas)
                      : canvas,
                  );
                  break;
                case "DELETE":
                  updatedCanvases = updatedCanvases.filter(
                    (canvas) => canvas.id !== oldCanvasData.id,
                  );
                  break;
                default:
                  console.error(
                    "[SUBSCRIPTION-MANAGER] Unhandled event type:",
                    eventType,
                  );
                  break;
              }

              return updatedCanvases;
            });
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            // Do nothing
            return;
          }
          if (
            status === "TIMED_OUT" ||
            status === "CLOSED" ||
            status === "CHANNEL_ERROR"
          ) {
            this.handleSubscriptionError(
              this.subscribeToCanvasUpdates.bind(this, setCanvases),
            );
            return;
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

const getCanvasDesignsMap = (designs: Design[]): Map<number, Design[]> => {
  return designs.reduce((map, design) => {
    const canvasId = design.canvas ?? -1;
    if (!map.has(canvasId)) {
      map.set(canvasId, []);
    }
    map.get(canvasId)!.push(design);
    return map;
  }, new Map<number, Design[]>());
}

const getDesignsMap = (designs: Design[]): Map<number, Design> => {
  return designs.reduce((map, design) => {
    const designId = design.id;
    map.set(designId, design)
    return map;
  }, new Map<number, Design>());
}

const getCanvasesMap = (canvases: Canvas[]): Map<number, Canvas> => {
  return canvases.reduce((map, canvas) => {
    const canvasId = canvas.id;
    map.set(canvasId, canvas)
    return map;
  }, new Map<number, Canvas>());
}

// Start with empty data - will be loaded asynchronously
const initialData = { designs: [], canvases: [] };

interface DesignContextProps {
  designs: Design[];
  designsMap: Map<number, Design>;
  canvases: Canvas[];
  canvasesMap: Map<number, Canvas>;
  canvasDesignsMap: Map<number, Design[]>,
  setDesigns: React.Dispatch<React.SetStateAction<Design[]>>;
  setCanvases: React.Dispatch<React.SetStateAction<Canvas[]>>;
}

const DesignContext = createContext<DesignContextProps>({
  designs: initialData.designs,
  designsMap: getDesignsMap(initialData.designs),
  canvases: initialData.canvases,
  canvasesMap: getCanvasesMap(initialData.canvases),
  canvasDesignsMap: getCanvasDesignsMap(initialData.designs),
  setDesigns: () => {},
  setCanvases: () => {},
});

export const useDesignContext = () => {
  const context = useContext(DesignContext);
  if (context === undefined) {
    throw new Error(
      "useDesignContext must be used within a DesignContext.Provider",
    );
  }
  return context;
};

interface DesignProviderProps {
  children: ReactNode;
}

export const DesignProvider: React.FC<DesignProviderProps> = ({ children }) => {
  const { users, ranks } = useUserContext();
  const [designs, setDesigns] = useState<Design[]>(initialData.designs);
  const [canvases, setCanvases] = useState<Canvas[]>(initialData.canvases);

  // Use useMemo for derived state instead of useState + useEffect
  const designsMap = useMemo(() => getDesignsMap(designs), [designs]);
  const canvasesMap = useMemo(() => getCanvasesMap(canvases), [canvases]);
  const canvasDesignsMap = useMemo(() => getCanvasDesignsMap(designs), [designs]);

  const subscriptionManager = useRef(SupabaseSubscriptionManager.getInstance());

  // Load initial data asynchronously
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Only fetch if we don't have any data yet
        if (designs.length === 0 && canvases.length === 0) {
          const data = await fetchAllData();
          setDesigns(data.designs);
          setCanvases(data.canvases);
        }
      } catch (error) {
        console.error('Failed to load initial designs and canvases:', error);
      }
    };

    loadInitialData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const currentSubscriptionManager = subscriptionManager.current;
    currentSubscriptionManager.subscribeToDesignUpdates(setDesigns, users, ranks, canvases);
    currentSubscriptionManager.subscribeToCanvasUpdates(setCanvases);

    return () => {
      currentSubscriptionManager.unsubscribeAll();
    };
  }, [users, ranks, canvases]);

  const contextValue = useMemo(() => ({
    designs,
    canvases,
    designsMap,
    canvasesMap,
    canvasDesignsMap,
    setDesigns,
    setCanvases,
  }), [designs, canvases, designsMap, canvasesMap, canvasDesignsMap, setDesigns, setCanvases]);

  return (
    <DesignContext.Provider value={contextValue}>
      {children}
    </DesignContext.Provider>
  );
};
