import React, { createContext, useContext, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';


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
    discountReason?: string;
    grandTotal: number;
    paymentMethod: 'cash' | 'card' | 'upi';
    offerImageBase64?: string;
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

    // Handle cross-tab synchronization
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'bill_history' && e.newValue) {
                try {
                    const newBills = JSON.parse(e.newValue);
                    setBills(newBills);
                } catch (err) {
                    console.error("Error parsing synced bills", err);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Midnight Auto-Clear Logic
    useEffect(() => {
        const checkAndClearHistory = () => {
            const lastClearDate = localStorage.getItem('last_auto_clear_date');
            const todayStr = new Date().toISOString().split('T')[0];

            if (lastClearDate !== todayStr) {
                // It's a new day (or first run).
                // Check if we have bills from *yesterday* or before to backup.
                const storedBills = JSON.parse(localStorage.getItem('bill_history') || '[]');

                if (storedBills.length > 0) {
                    console.log("Detecting new day. Performing Auto-Backup and Clear...");

                    // 1. Auto Backup
                    try {
                        const data = storedBills.map((bill: Bill) => ({
                            'Bill Number': bill.billNumber,
                            'Date': new Date(bill.date).toLocaleString(),
                            'Customer Name': bill.customerName,
                            'Phone': bill.customerWhatsApp,
                            'Services': bill.services.map((s: ServiceItem) => `${s.name} (${s.quantity})`).join('; '),
                            'Subtotal': bill.subtotal,
                            'Tax': bill.taxAmount,
                            'Discount': bill.discount,
                            'Grand Total': bill.grandTotal,
                            'Payment': bill.paymentMethod
                        }));

                        const wb = XLSX.utils.book_new();
                        const ws = XLSX.utils.json_to_sheet(data);
                        XLSX.utils.book_append_sheet(wb, ws, "Daily Backup");

                        // Generate filename with YESTERDAY'S date or just 'AutoBackup_DATE'
                        XLSX.writeFile(wb, `AutoBackup_Sales_${new Date().toISOString().split('T')[0]}.xlsx`);
                    } catch (e) {
                        console.error("Auto-backup failed", e);
                    }

                    // 2. Clear History
                    setBills([]);
                    localStorage.setItem('bill_history', '[]');
                }

                // 3. Mark today as cleared
                localStorage.setItem('last_auto_clear_date', todayStr);
            }
        };

        // Run immediately on mount
        checkAndClearHistory();

        // Run periodically (every 1 hour) to catch midnight crossover in long-running tabs
        const interval = setInterval(checkAndClearHistory, 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Firebase Sync disabled for local-first single-device use
    /*
    useEffect(() => {
        const unsubscribe = firebaseService.subscribeToBills((firebaseBills) => {
            if (firebaseBills.length > 0) {
                setBills(firebaseBills);
                localStorage.setItem('bill_history', JSON.stringify(firebaseBills));
            }
        });
        return () => unsubscribe();
    }, []);
    */

    const addBill = async (bill: Bill) => {
        setBills(prev => [bill, ...prev]);
        // Firebase sync disabled for local-first use
        /*
        try {
            await firebaseService.saveBill(bill);
        } catch (error) {
            console.warn("Firebase sync failed, saved locally", error);
        }
        */
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
