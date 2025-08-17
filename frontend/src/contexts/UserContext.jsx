//UserContext.js

import React, {createContext, useContext, useState} from "react";

// Create the context
const UserContext = createContext();

export function UserProvider({ children }) {
    const [userData, setUserData] = useState({});

    const addUserData = (newData) => {
        setUserData((prev) => ({ ...prev, ...newData })); // Merge new data into the existing object
    };

    return (
        <UserContext.Provider value={{ userData, setUserData, addUserData }}>
            {children}
        </UserContext.Provider>
    );
}

export const useData = () => useContext(UserContext);