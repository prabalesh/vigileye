import { create } from 'zustand';
import type { User } from '../types';
import * as authApi from '../api/auth';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: async (data) => {
        const res = await authApi.login(data);
        set({ user: res.data.user, isAuthenticated: true });
    },
    register: async (data) => {
        const res = await authApi.register(data);
        set({ user: res.data.user, isAuthenticated: true });
    },
    logout: async () => {
        set({ user: null, isAuthenticated: false });
    },
    fetchMe: async () => {
        try {
            set({ isLoading: true });
            const res = await authApi.fetchMe();
            set({ user: res.data, isAuthenticated: true, isLoading: false });
        } catch (err) {
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },
}));
