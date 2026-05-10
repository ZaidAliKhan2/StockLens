import api from './axios';

export const runScreener = (params) => api.get('/screener', { params });
export const getSectorVolatility = (params) => api.get('/sectors/volatility', { params });
export const listSectors = () => api.get('/sectors/list');
