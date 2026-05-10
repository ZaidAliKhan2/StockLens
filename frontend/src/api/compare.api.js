import api from './axios';

export const compareStocks = (params) => api.get('/compare', { params });
export const getCorrelation = (params) => api.get('/compare/correlation', { params });
