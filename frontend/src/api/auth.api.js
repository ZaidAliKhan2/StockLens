import api from './axios';

export const register = (payload) => api.post('/auth/register', payload);
export const verifyOTP = (payload) => api.post('/auth/verify-otp', payload);
export const login = (payload) => api.post('/auth/login', payload);
export const resendOTP = (payload) => api.post('/auth/resend-otp', payload);
export const getMe = () => api.get('/auth/me');
