import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the shape of our settings
export interface SalonSettings {
    salonName: string;
    address: string;
    ownerName: string;
    ownerWhatsApp: string; // e.g., "919876543210"
    taxRate: number; // percentage, e.g., 5 for 5%
    enableTax: boolean;
    currencySymbol: string;
    predefinedServices: { id: string; name: string; price: number }[];
}

const defaultSettings: SalonSettings = {
    salonName: "My Salon",
    address: "123 Beauty Street, City",
    ownerName: "Owner",
    ownerWhatsApp: "",
    taxRate: 0,
    enableTax: false,
    currencySymbol: "₹",
    predefinedServices: [],
};

const SalonSettingsContext = createContext<{
    settings: SalonSettings;
    updateSettings: (newSettings: Partial<SalonSettings>) => void;
} | undefined>(undefined);

export const SalonSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SalonSettings>(() => {
        const saved = localStorage.getItem('salon_settings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    });

    useEffect(() => {
        localStorage.setItem('salon_settings', JSON.stringify(settings));
    }, [settings]);

    const updateSettings = (newSettings: Partial<SalonSettings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    return (
        <SalonSettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SalonSettingsContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSalonSettings = () => {
    const context = useContext(SalonSettingsContext);
    if (!context) throw new Error("useSalonSettings must be used within a SalonSettingsProvider");
    return context;
};
