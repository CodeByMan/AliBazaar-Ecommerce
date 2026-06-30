import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CustomerProfile } from '@/lib/api/auth';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

type AuthState = {
  status: AuthStatus;
  user: CustomerProfile | null;
};

const initialState: AuthState = {
  status: 'loading',
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<CustomerProfile>) => {
      state.status = 'authenticated';
      state.user = action.payload;
    },
    setGuest: (state) => {
      state.status = 'guest';
      state.user = null;
    },
    setAuthLoading: (state) => {
      state.status = 'loading';
    },
  },
});

export const { setAuthenticated, setGuest, setAuthLoading } = authSlice.actions;
export default authSlice.reducer;
