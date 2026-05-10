import { useState } from 'react';
import { getSectorVolatility, listSectors, runScreener } from '../api/screener.api';

const useScreener = () => {
  const [results, setResults] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [volatility, setVolatility] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadSectors = async () => {
    try {
      const response = await listSectors();
      setSectors(response.data?.sectors || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const screen = async (params) => {
    setLoading(true);
    setError('');

    try {
      const response = await runScreener(params);
      const nextResults = response.data?.results || [];
      setResults(nextResults);
      return nextResults;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadVolatility = async (params) => {
    try {
      const response = await getSectorVolatility(params);
      const nextVolatility = response.data?.results || [];
      setVolatility(nextVolatility);
      return nextVolatility;
    } catch (err) {
      setVolatility([]);
      setError(err.message);
      return [];
    }
  };

  return { results, sectors, volatility, loading, error, loadSectors, screen, loadVolatility };
};

export default useScreener;
