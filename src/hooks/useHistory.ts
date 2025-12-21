import { useState, useMemo, useCallback } from "react";

export function useHistory<T>(initialState: T) {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<T[]>([initialState]);

  const state = useMemo(() => history[index], [history, index]);

  const setState = useCallback((action: T | ((prev: T) => T)) => {
    setHistory((prev) => {
      const current = prev[index];
      const next = typeof action === 'function' ? (action as Function)(current) : action;
      if (JSON.stringify(current) === JSON.stringify(next)) return prev;
      const newHistory = prev.slice(0, index + 1);
      newHistory.push(next);
      return newHistory;
    });
    setIndex((prev) => prev + 1);
  }, [index]);

  const undo = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const redo = useCallback(() => setIndex((i) => Math.min(history.length - 1, i + 1)), [history]);

  return { state, setState, undo, redo, canUndo: index > 0, canRedo: index < history.length - 1 };
}

export default useHistory