import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { adminGetStockMovements } from "../lib/admin";

interface NewMovementsContextType {
  count: number;
  refresh: () => Promise<void>;
}

const NewMovementsContext = createContext<NewMovementsContextType | null>(null);

export function NewMovementsProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  
  const refresh = useCallback(async () => {
    // hitung movements dalam 24 jam terakhir
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const movements = await adminGetStockMovements({
      startDate: yesterday.toISOString(),
    });
    setCount(movements.length);
  }, []);

  useEffect(() => {
    void (async () => {
      await refresh();
    })();
  }, [refresh]);

  return (
    <NewMovementsContext.Provider value={{ count, refresh }}>
      {children}
    </NewMovementsContext.Provider>
  );
}

export function useNewMovements() {
  const ctx = useContext(NewMovementsContext);
  if (!ctx) throw new Error("useNewMovements must be used within NewMovementsProvider");
  return ctx;
}
