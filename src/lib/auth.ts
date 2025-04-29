import { createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';

export const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
}>({
  user: null,
  loading: true,
});

export const useAuth = () => {
  return useContext(AuthContext);
};