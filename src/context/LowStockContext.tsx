import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { adminCountLowStock, LOW_STOCK_THRESHOLD } from "../lib/admin";

interface LowStockContextType {
  count: number;
  threshold: number;
  refresh: () => Promise<void>;
}

const LowStockContext = createContext<LowStockContextType | null>(null);

export function LowStockProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const refresh = useCallback(async () => {
    const n = await adminCountLowStock();
    setCount(n);
  }, []);

  useEffect(() => {
    void (async () => {
      await refresh();
    })();
  }, [refresh]);

  return (
    <LowStockContext.Provider
      value={{ count, threshold: LOW_STOCK_THRESHOLD, refresh }}
    >
      {children}
    </LowStockContext.Provider>
  );
}

export function useLowStock() {
    const ctx = useContext(LowStockContext);
    if (!ctx) throw new Error("useLowStock must be used within LowStockProvider");
    return ctx;
}
