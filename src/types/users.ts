import { User } from '@supabase/supabase-js';

export type AuthUserType = User & {
  id: string;
  email: string;
  // Add any additional fields if needed
};

export interface UserContextProps {
  users: UserType[];
  currentUser: UserType | null;
  rankNames: { [key: string]: string };
  updateUser: (updatedUser: UserType) => void;
  logoutUser: () => void;
}

// Define the interface for user types
export interface UserType {
  user_id: string;
  handle: string | null; // If handle can be null, use string | null
  email: string | null;  // Same for email
  rank: string;
}

// Define the interface for rank types
export interface RankType {
  rank_id: string;
  rank_name: string | null; // If rank_name can be null, use string | null
}
