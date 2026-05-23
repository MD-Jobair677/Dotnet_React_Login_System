import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { jwtDecode } from 'jwt-decode';

type Permission = string;
type Role = string;

type DecodedToken = {
  Permission?: Permission[];
  role?: Role;
  [key: string]: unknown;
};

type User = {
  firstName?: string;
  lastName?: string;
  email?: string;
  roles?: Role[];
  permissions?: Permission[];
};

type AuthState = {
  token: string | null;
  user: User | null;
  permissions: Permission[];
};

type CredentialsPayload = {
  token: string;
  user: User | null;
};

const tokenFromStorage = localStorage.getItem('token');

const decodeToken = (token: string | null): { permissions: Permission[] } => {
  if (!token) return { permissions: [] };
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const permissions = decoded.Permission ?? [];
    return { permissions };
  } catch {
    return { permissions: [] };
  }
};

const { permissions: initialPermissions } = decodeToken(tokenFromStorage);

const initialState: AuthState = {
  token: tokenFromStorage,
  user: null,
  permissions: initialPermissions,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<CredentialsPayload>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      const { permissions } = decodeToken(action.payload.token);
      state.permissions = permissions;
      localStorage.setItem('token', action.payload.token);
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.permissions = [];
      localStorage.removeItem('token');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
