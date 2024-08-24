import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { functionsFetchUsers, functionsGetRankName } from '../api/supabase/functions';

// Define the User interface for currentUser
interface User {
    id: string;
    handle: string;
    rank: string;
    rank_name: string;
    // Add other properties as necessary
}

interface UserContextType {
    rankNames: string[];
    users: any[];
    currentUser: User | null; // Include currentUser in the context type
    setCurrentUser: (user: User | null) => void; // Function to update currentUser
    logoutUser: () => void; // Function to handle user logout
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUserContext = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUserContext must be used within a UserProvider');
    }
    return context;
};

interface UserProviderProps {
    children: ReactNode;
}

// Simple function to generate a unique ID without using uuid
const generateUniqueId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Function to fetch initial user data
const fetchInitialUserData = async () => {
    const rankNames = await functionsGetRankName();
    const users = await functionsFetchUsers();
    return { rankNames, users };
};

// Fetch initial data before creating the context
const initialDataPromise = fetchInitialUserData();

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const [rankNames, setRankNames] = useState<string[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null); // State for currentUser
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    const contextId = useRef(generateUniqueId());  // Generate a unique ID for each context instance
    const initializationRef = useRef(false);  // Ref to track initialization

    const logMessage = (message: string) => {
        console.log(`[UserContext ${contextId.current}] ${message}`);
    };

    // Function to handle logout
    const logoutUser = () => {
        setCurrentUser(null);
        logMessage('User logged out.');
    };

    // Modified setCurrentUser with logging
    const handleSetCurrentUser = (user: User | null) => {
        setCurrentUser(user);
        logMessage(`Current user updated: ${JSON.stringify(user)}`);
    };

    useEffect(() => {
        const initializeUserData = async () => {
            if (initializationRef.current) {
                logMessage('Initialization already completed, skipping...');
                return;
            }

            initializationRef.current = true;
            logMessage('Initializing user data...');

            try {
                const { rankNames, users } = await initialDataPromise;
                setRankNames(rankNames);
                setUsers(users);
                setIsInitialized(true);
                logMessage('User data initialized successfully.');
            } catch (error) {
                console.error('Error during user data initialization:', error);
            }
        };

        initializeUserData();
    }, []); // Only run once on component mount

    if (!isInitialized) {
        // Optionally show a loading state while initializing
        return <div>Loading...</div>;
    }

    return (
        <UserContext.Provider value={{ rankNames, users, currentUser, setCurrentUser: handleSetCurrentUser, logoutUser }}>
            {children}
        </UserContext.Provider>
    );
};
