import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ServiceItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

export interface Bill {
    id: string;
    billNumber: string;
    customerName: string;
    customerWhatsApp: string;
    date: string; // ISO string
    services: ServiceItem[];
    subtotal: number;
    taxAmount: number;
    discount: number;
    grandTotal: number;
}

const BillHistoryContext = createContext<{
    bills: Bill[];
    addBill: (bill: Bill) => void;
    clearHistory: () => void;
} | undefined>(undefined);

export const BillHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [bills, setBills] = useState<Bill[]>(() => {
        const saved = localStorage.getItem('bill_history');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('bill_history', JSON.stringify(bills));
    }, [bills]);

    const addBill = (bill: Bill) => {
        setBills(prev => [bill, ...prev]);
    };

    const clearHistory = () => {
        setBills([]);
    };

    return (
        <BillHistoryContext.Provider value={{ bills, addBill, clearHistory }}>
            {children}
        </BillHistoryContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useBillHistory = () => {
    const context = useContext(BillHistoryContext);
    if (!context) throw new Error("useBillHistory must be used within a BillHistoryProvider");
    return context;
};
