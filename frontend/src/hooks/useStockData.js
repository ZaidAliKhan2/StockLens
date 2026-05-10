import { useState } from 'react';
import {
  getBestWorstMonth,
  getMovingAverages,
  getPriceHistory,
  getStockStats,
} from '../api/stock.api';

const useStockData = () => {
  const [data, setData] = useState({ history: [], stats: null, movingAverages: [], bestWorst: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadStockData = async (params) => {
    setLoading(true);
    setError('');

    try {
      const [history, stats, movingAverages, bestWorst] = await Promise.all([
        getPriceHistory(params),
        getStockStats(params),
        getMovingAverages(params),
        getBestWorstMonth(params),
      ]);

      const nextData = {
        history: history.data?.history || [],
        stats: stats.data?.stats || null,
        movingAverages: movingAverages.data?.movingAverages || [],
        bestWorst: bestWorst.data || null,
      };
      setData(nextData);
      return nextData;
    } catch (err) {
      setError(err.message);
      return { history: [], stats: null, movingAverages: [], bestWorst: null };
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, loadStockData };
};

export default useStockData;
