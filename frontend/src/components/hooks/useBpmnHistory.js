import { useState, useRef, useCallback } from 'react';

export function useBpmnHistory() {
  const [history, setHistory] = useState([]);
  const historyIdRef = useRef(0);

  const addChange = useCallback((change) => {
    const timestamp = new Date().toLocaleTimeString();
    const historyEntry = {
      id: ++historyIdRef.current,
      timestamp,
      change,
      type: change.type || 'info'
    };
    
    setHistory(prev => [...prev, historyEntry]);
    
    // Return the entry for immediate use if needed
    return historyEntry;
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    historyIdRef.current = 0;
  }, []);

  return {
    history,
    addChange,
    clearHistory
  };
}