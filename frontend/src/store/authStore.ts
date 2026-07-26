import { create } from 'zustand'
import { jwtDecode } from 'jwt-decode'

interface AuthState {
    token: string | null;
    user: any | null;
    login: (token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: localStorage.getItem('aegis_token'),
    user: localStorage.getItem('aegis_token') ? jwtDecode(localStorage.getItem('aegis_token') as string) : null,
    login: (token) => {
        localStorage.setItem('aegis_token', token);
        set({ token, user: jwtDecode(token) });
    },
    logout: () => {
        localStorage.removeItem('aegis_token');
        set({ token: null, user: null });
    }
}))
