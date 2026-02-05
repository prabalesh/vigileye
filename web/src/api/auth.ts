import client from './client';
import type { User } from '../types';

export const login = (data: any) => client.post('/api/auth/login', data);
export const register = (data: any) => client.post('/api/auth/register', data);
export const fetchMe = () => client.get<User>('/api/auth/me');
