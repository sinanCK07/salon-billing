import React, { createContext, useContext, useState, useEffect } from 'react';
import { firebaseService } from '../lib/firebaseService';

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
    gstNumber?: string;
    googleReviewLink?: string;
    instagramLink?: string;
    settingsPassword?: string; // Hashed password
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
    gstNumber: "",
    googleReviewLink: "",
    instagramLink: "",
    settingsPassword: "", // Default: No password
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

    const updateSettings = async (newSettings: Partial<SalonSettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };

            // Sync predefined services to Firebase
            if (newSettings.predefinedServices) {
                newSettings.predefinedServices.forEach(async (service) => {
                    try {
                        await firebaseService.saveService(service);
                    } catch (e) {
                        console.warn("Service sync failed", e);
                    }
                });
            }

            return updated;
        });
    };

    // Firebase Sync for Services
    useEffect(() => {
        const unsubscribe = firebaseService.subscribeToServices((firebaseServices) => {
            if (firebaseServices.length > 0) {
                setSettings(prev => ({
                    ...prev,
                    predefinedServices: firebaseServices
                }));
            }
        });
        return () => unsubscribe();
    }, []);

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
