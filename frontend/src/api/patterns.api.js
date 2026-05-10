import api from './axios';

export const getGreenDays = (params) => api.get('/patterns/green-days', { params });
export const getVolumeSpike = (params) => api.get('/patterns/volume-spike', { params });
export const getMACrossover = (params) => api.get('/patterns/ma-crossover', { params });
