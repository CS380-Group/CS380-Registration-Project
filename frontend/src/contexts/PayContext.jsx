// PayContext.js

import React, { createContext, useContext, useState } from 'react';

const PayContext = createContext(null);

export const PayProvider = ({ children }) => {
    const [payData, setPayData] = useState({
        paymentType: 'creditCard',
        cardNumber: '',
        cvv: '',
        expirationDate: '',
        cardHolder: '',
    });

    const addPayData = (newData) => {
        setPayData((prev) => ({ ...prev, ...newData }));
    };

    return (
        <PayContext.Provider value={{ payData, setPayData, addPayData }}>
            {children}
        </PayContext.Provider>
    );
};

export const usePayData = () => {
    const context = useContext(PayContext);
    if (!context) {
        throw new Error('usePayData must be used within a PayProvider');
    }
    return context;
};