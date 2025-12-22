import React from 'react';
import { Receipt, History, Settings, LayoutDashboard } from 'lucide-react';
import { useSalonSettings } from '../context/SalonSettingsContext';

interface LayoutProps {
    children: React.ReactNode;
    currentView: 'billing' | 'history' | 'settings' | 'dashboard';
    onNavigate: (view: 'billing' | 'history' | 'settings' | 'dashboard') => void;
}

export default function AppLayout({ children, currentView, onNavigate }: LayoutProps) {
    const { settings } = useSalonSettings();

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 pb-20">
            {/* Header */}
            <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                            {settings.salonName.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-800">{settings.salonName}</h1>
                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{settings.address}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 max-w-lg mx-auto">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 z-20 pb-safe">
                <button
                    onClick={() => onNavigate('dashboard')}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors ${currentView === 'dashboard' ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <LayoutDashboard size={24} />
                    <span className="text-xs font-medium mt-1">Dash</span>
                </button>
                <button
                    onClick={() => onNavigate('billing')}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors ${currentView === 'billing' ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <Receipt size={24} />
                    <span className="text-xs font-medium mt-1">New Bill</span>
                </button>
                <button
                    onClick={() => onNavigate('history')}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors ${currentView === 'history' ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <History size={24} />
                    <span className="text-xs font-medium mt-1">History</span>
                </button>
                <button
                    onClick={() => onNavigate('settings')}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors ${currentView === 'settings' ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <Settings size={24} />
                    <span className="text-xs font-medium mt-1">Settings</span>
                </button>
            </nav>
        </div>
    );
};
