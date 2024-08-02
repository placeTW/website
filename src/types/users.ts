// src/types.ts

import { User } from '@supabase/supabase-js';

export type AuthUserType = User & {
  id: string;
  email: string;
  // Add any additional fields if needed
};

export type UserType = {
  user_id: string;
  email: string;
  handle: string;
  rank: string;
  rank_name?: string;
};

export interface UserContextProps {
  users: UserType[];
  currentUser: UserType | null;
  rankNames: { [key: string]: string };
  updateUser: (updatedUser: UserType) => void;
  logoutUser: () => void;
}