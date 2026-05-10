import { useState } from 'react';
import { compareStocks, getCorrelation } from '../api/compare.api';

const useComparator = () => {
  const [comparison, setComparison] = useState(null);
  const [correlation, setCorrelation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runComparison = async (params) => {
    setLoading(true);
    setError('');

    try {
      const tickers = Array.isArray(params.tickers)
        ? params.tickers.filter(Boolean).map((ticker) => ticker.trim().toUpperCase())
        : String(params.tickers || '').split(',').map((ticker) => ticker.trim().toUpperCase()).filter(Boolean);
      const [comparisonResponse, correlationResponse] = await Promise.all([
        compareStocks({ tickers: tickers.join(','), start: params.start, end: params.end }),
        getCorrelation({ ticker1: tickers[0], ticker2: tickers[1], start: params.start, end: params.end }),
      ]);
      const nextComparison = comparisonResponse.data;
      const nextCorrelation = correlationResponse.data?.correlation || null;
      setComparison(nextComparison);
      setCorrelation(nextCorrelation);
      return { comparison: nextComparison, correlation: nextCorrelation };
    } catch (err) {
      setError(err.message);
      return { comparison: null, correlation: null };
    } finally {
      setLoading(false);
    }
  };

  return { comparison, correlation, loading, error, runComparison };
};

export default useComparator;
