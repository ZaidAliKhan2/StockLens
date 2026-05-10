import { useState } from 'react';
import { getGreenDays, getMACrossover, getVolumeSpike } from '../api/patterns.api';

const usePatterns = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runPattern = async (patternType, params) => {
    setLoading(true);
    setError('');

    try {
      const response = patternType === 'volume-spike'
        ? await getVolumeSpike(params)
        : patternType === 'ma-crossover'
          ? await getMACrossover(params)
          : await getGreenDays(params);
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

  return { results, loading, error, runPattern };
};

export default usePatterns;
