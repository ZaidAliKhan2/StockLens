import api from './axios';

export const getPriceHistory = (params) => api.get('/stock/history', { params });
export const getStockStats = (params) => api.get('/stock/stats', { params });
export const getMovingAverages = (params) => api.get('/stock/moving-averages', { params });
export const getBestWorstMonth = (params) => api.get('/stock/best-worst-month', { params });
