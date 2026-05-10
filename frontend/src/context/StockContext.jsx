import { createContext, useContext, useMemo, useState } from 'react';

const StockContext = createContext(null);

export const StockProvider = ({ children }) => {
  const [ticker, setTicker] = useState('AAPL');
  const [dateRange, setDateRange] = useState({ start: '2023-01-01', end: '2024-01-01' });

  const value = useMemo(() => ({ ticker, setTicker, dateRange, setDateRange }), [ticker, dateRange]);

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
};

export const useStockContext = () => {
  const context = useContext(StockContext);
  if (!context) {
    throw new Error('useStockContext must be used inside StockProvider');
  }
  return context;
};
