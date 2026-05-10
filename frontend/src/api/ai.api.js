import api from './axios';

export const explainResult = (featureType, resultData) => api.post('/ai/explain', { featureType, resultData });
