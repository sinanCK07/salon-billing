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
    predefinedServices: { id: string; name: string; price: number; category: string; editable?: boolean }[];
    categories: string[];
    gstNumber?: string;
    googleReviewLink?: string;
    instagramLink?: string;
    settingsPassword?: string; // Hashed password
    globalOfferImageBase64?: string;
    lastResetTime?: string; // ISO string for manual resetting of daily summary
    whatsappApiProvider: 'meta' | 'twilio' | 'none';
    whatsappAccessToken: string;
    whatsappPhoneNumberId: string;
}

const defaultSettings: SalonSettings = {
    salonName: "My Salon",
    address: "123 Beauty Street, City",
    ownerName: "Owner",
    ownerWhatsApp: "",
    taxRate: 0,
    enableTax: false,
    currencySymbol: "₹",
    predefinedServices: [
        { id: 'v1', name: 'STRAIGHTENING', price: 0, category: 'VARIABLE PRICES', editable: true },
        { id: 'v2', name: 'SMOOTHENING', price: 0, category: 'VARIABLE PRICES', editable: true },
        { id: 'v3', name: 'HAIR COLOURING', price: 0, category: 'VARIABLE PRICES', editable: true },
        { id: 'v4', name: 'MAKE UP', price: 0, category: 'VARIABLE PRICES', editable: true },
        { id: 'v5', name: 'TOUCH UP', price: 0, category: 'VARIABLE PRICES', editable: true },
    ] as any,
    categories: ['VARIABLE PRICES', 'Facial', 'Hair', 'Grooming'],
    gstNumber: "",
    googleReviewLink: "",
    instagramLink: "",
    settingsPassword: "", // Default: No password
    globalOfferImageBase64: "",
    lastResetTime: "",
    whatsappApiProvider: 'none',
    whatsappAccessToken: '',
    whatsappPhoneNumberId: '',
};

const SalonSettingsContext = createContext<{
    settings: SalonSettings;
    updateSettings: (newSettings: Partial<SalonSettings>) => void;
} | undefined>(undefined);

export const SalonSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SalonSettings>(() => {
        const saved = localStorage.getItem('salon_settings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as SalonSettings;
                
                const categories = parsed.categories || defaultSettings.categories;
                const predefinedServices = parsed.predefinedServices || defaultSettings.predefinedServices;

                let updatedCategories = [...categories];
                if (!updatedCategories.includes('VARIABLE PRICES')) {
                    updatedCategories = ['VARIABLE PRICES', ...updatedCategories];
                }
                
                const existingVIds = new Set(predefinedServices.map(s => s.id));
                
                let updatedServices = [...predefinedServices];
                const missingVariablePrices = defaultSettings.predefinedServices.filter(s => !existingVIds.has(s.id));
                if (missingVariablePrices.length > 0) {
                    updatedServices = [...missingVariablePrices, ...updatedServices];
                }
                
                return { 
                    ...defaultSettings, 
                    ...parsed, 
                    categories: updatedCategories, 
                    predefinedServices: updatedServices 
                };
            } catch (e) {
                console.error("Error loading settings from local storage, falling back to defaults", e);
                return defaultSettings;
            }
        }
        return defaultSettings;
    });

    useEffect(() => {
        localStorage.setItem('salon_settings', JSON.stringify(settings));
    }, [settings]);

    // Handle cross-tab synchronization
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'salon_settings' && e.newValue) {
                try {
                    const newSettings = JSON.parse(e.newValue);
                    setSettings(prev => ({ ...prev, ...newSettings }));
                } catch (err) {
                    console.error("Error parsing synced settings", err);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

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

    // Firebase Sync for Services - Disabled for local-first use
    /*
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
    */

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
