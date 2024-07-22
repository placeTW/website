import { createContext, useContext } from "react";
import { UserContextProps } from "../types";



export const UserContext = createContext<UserContextProps>({
  users: [],
  currentUser: null,
  rankNames: {},
  updateUser: () => {},
  logoutUser: () => {},
});

export const useUserContext = () => useContext(UserContext);